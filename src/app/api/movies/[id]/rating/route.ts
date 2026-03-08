import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

async function fetchMovieRuntime(
  movieId: number,
  apiKey: string
): Promise<number | null> {
  try {
    const { data } = await axios.get<{ runtime: number | null }>(
      `${TMDB_BASE_URL}/movie/${movieId}`,
      { params: { api_key: apiKey, language: "fr-FR" } }
    );
    return data.runtime ?? null;
  } catch {
    return null;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const apiKey = process.env.TMDB_API_KEY;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  if (!apiKey || !sessionId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!id || Number.isNaN(Number(id))) {
    return NextResponse.json(
      { error: "Invalid movie ID" },
      { status: 400 }
    );
  }

  let body: { value: number; runtime?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalide" },
      { status: 400 }
    );
  }

  const { value, runtime: runtimeFromBody } = body;
  if (
    typeof value !== "number" ||
    value < 0.5 ||
    value > 10 ||
    (value * 2) % 1 !== 0
  ) {
    return NextResponse.json(
      { error: "La note doit être entre 0.5 et 10 (par paliers de 0.5)" },
      { status: 400 }
    );
  }

  try {
    await axios.post(
      `${TMDB_BASE_URL}/movie/${id}/rating`,
      { value },
      {
        params: { api_key: apiKey, session_id: sessionId },
        headers: { "Content-Type": "application/json" },
      }
    );

    // Stocker le runtime pour le compteur (tracking interne, pas de double-comptage)
    const session = await prisma.session.findUnique({
      where: { tmdb_session_id: sessionId },
      include: { user: true },
    });

    if (session?.user) {
      const runtime =
        typeof runtimeFromBody === "number" && runtimeFromBody >= 0
          ? runtimeFromBody
          : await fetchMovieRuntime(Number(id), apiKey);

      await prisma.watchTimeEntry.upsert({
        where: {
          userId_tmdb_movie_id: {
            userId: session.user.id,
            tmdb_movie_id: Number(id),
          },
        },
        create: {
          userId: session.user.id,
          tmdb_movie_id: Number(id),
          runtime,
        },
        update: { runtime },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible d'ajouter la note" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const apiKey = process.env.TMDB_API_KEY;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  if (!apiKey || !sessionId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!id || Number.isNaN(Number(id))) {
    return NextResponse.json(
      { error: "Invalid movie ID" },
      { status: 400 }
    );
  }

  const session = await prisma.session.findUnique({
    where: { tmdb_session_id: sessionId },
  });

  try {
    await axios.delete(
      `${TMDB_BASE_URL}/movie/${id}/rating`,
      {
        params: { api_key: apiKey, session_id: sessionId },
      }
    );
  } catch {
    // Même en cas d'échec TMDB, on supprime de notre BDD pour garder le compteur cohérent
    if (session) {
      await prisma.watchTimeEntry.deleteMany({
        where: {
          userId: session.userId,
          tmdb_movie_id: Number(id),
        },
      });
    }
    return NextResponse.json(
      { error: "Impossible de supprimer la note" },
      { status: 500 }
    );
  }

  // Supprimer du tracking (le film n'est plus compté)
  if (session) {
    await prisma.watchTimeEntry.deleteMany({
      where: {
        userId: session.userId,
        tmdb_movie_id: Number(id),
      },
    });
  }

  return NextResponse.json({ success: true });
}
