import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { fetchMovieDetails, fetchTvDetails } from "@/lib/tmdb";
import { tmdbClient } from "@/lib/tmdb-client";

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

  const tmdbSessionId = (await cookies()).get("tmdb_session_id")?.value;
  if (!tmdbSessionId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!tmdbClient.isConfigured()) {
    return NextResponse.json(
      { error: "TMDB_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const account = await tmdbClient.get<{ id: number }>("/account", {
      session_id: tmdbSessionId,
    });
    const accountId = account.id;

    const mediaType =
      (suggestion.media_type as "movie" | "tv") || "movie";

    await tmdbClient.post(
      `/account/${accountId}/watchlist`,
      {
        media_type: mediaType,
        media_id: suggestion.tmdb_movie_id,
        watchlist: true,
      },
      { session_id: tmdbSessionId }
    );

    if (mediaType === "tv") {
      const tv = await fetchTvDetails(suggestion.tmdb_movie_id);
      if (tv) {
        await prisma.watchlistItem.upsert({
          where: {
            userId_media_type_tmdb_movie_id: {
              userId: session.user.id,
              media_type: "tv",
              tmdb_movie_id: suggestion.tmdb_movie_id,
            },
          },
          create: {
            userId: session.user.id,
            tmdb_movie_id: suggestion.tmdb_movie_id,
            media_type: "tv",
            poster_path: tv.poster_path,
            title: tv.name,
            release_date: tv.first_air_date || null,
            vote_average: tv.vote_average,
            overview: tv.overview || null,
          },
          update: {
            poster_path: tv.poster_path,
            title: tv.name,
            release_date: tv.first_air_date || null,
            vote_average: tv.vote_average,
            overview: tv.overview || null,
          },
        });
      }
    } else {
      const movie = await fetchMovieDetails(suggestion.tmdb_movie_id);
      if (movie) {
        await prisma.watchlistItem.upsert({
          where: {
            userId_media_type_tmdb_movie_id: {
              userId: session.user.id,
              media_type: "movie",
              tmdb_movie_id: suggestion.tmdb_movie_id,
            },
          },
          create: {
            userId: session.user.id,
            tmdb_movie_id: suggestion.tmdb_movie_id,
            media_type: "movie",
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
