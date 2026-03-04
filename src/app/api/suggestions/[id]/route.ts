import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { fetchMovieDetails } from "@/lib/tmdb";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;
  if (!sessionId) return null;
  const session = await prisma.session.findUnique({
    where: { tmdb_session_id: sessionId },
    include: { user: true },
  });
  return session ?? null;
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suggestion = await prisma.suggestion.findUnique({
    where: { id },
    include: { sender: true },
  });

  if (!suggestion) {
    return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  }

  if (suggestion.toUserId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.TMDB_API_KEY;
  const tmdbSessionId = (await cookies()).get("tmdb_session_id")?.value;
  if (!apiKey || !tmdbSessionId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const accountRes = await axios.get(`${TMDB_BASE_URL}/account`, {
      params: { api_key: apiKey, session_id: tmdbSessionId },
    });
    const accountId = accountRes.data.id;

    await axios.post(
      `${TMDB_BASE_URL}/account/${accountId}/watchlist`,
      {
        media_type: "movie",
        media_id: suggestion.tmdb_movie_id,
        watchlist: true,
      },
      {
        params: { api_key: apiKey, session_id: tmdbSessionId },
        headers: { "Content-Type": "application/json" },
      }
    );

    const movie = await fetchMovieDetails(suggestion.tmdb_movie_id);
    if (movie) {
      await prisma.watchlistItem.upsert({
        where: {
          userId_tmdb_movie_id: {
            userId: session.user.id,
            tmdb_movie_id: suggestion.tmdb_movie_id,
          },
        },
        create: {
          userId: session.user.id,
          tmdb_movie_id: suggestion.tmdb_movie_id,
          poster_path: movie.poster_path,
          title: movie.title,
          release_date: movie.release_date || null,
          vote_average: movie.vote_average,
          overview: movie.overview || null,
        },
        update: {
          poster_path: movie.poster_path,
          title: movie.title,
          release_date: movie.release_date || null,
          vote_average: movie.vote_average,
          overview: movie.overview || null,
        },
      });
    }

    await prisma.suggestion.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible d'ajouter à la watchlist" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suggestion = await prisma.suggestion.findUnique({
    where: { id },
  });

  if (!suggestion) {
    return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  }

  if (suggestion.toUserId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.suggestion.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
