import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { fetchTvTotalRuntime } from "@/lib/tmdb";
import { tmdbClient } from "@/lib/tmdb-client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!tmdbClient.isConfigured()) {
    return NextResponse.json(
      { error: "TMDB_API_KEY is not configured" },
      { status: 500 }
    );
  }

  if (!id || Number.isNaN(Number(id))) {
    return NextResponse.json(
      { error: "Invalid TV series ID" },
      { status: 400 }
    );
  }

  let body: { value: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalide" },
      { status: 400 }
    );
  }

  const { value } = body;
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
    await tmdbClient.post(`/tv/${id}/rating`, { value }, {
      session_id: sessionId,
    });

    // Stocker le temps de visionnage total (somme des épisodes)
    const session = await prisma.session.findUnique({
      where: { tmdb_session_id: sessionId },
      include: { user: true },
    });

    if (session?.user) {
      const runtime = await fetchTvTotalRuntime(Number(id));

      await prisma.watchTimeEntry.upsert({
        where: {
          userId_media_type_tmdb_movie_id: {
            userId: session.user.id,
            media_type: "tv",
            tmdb_movie_id: Number(id),
          },
        },
        create: {
          userId: session.user.id,
          tmdb_movie_id: Number(id),
          media_type: "tv",
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
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!tmdbClient.isConfigured()) {
    return NextResponse.json(
      { error: "TMDB_API_KEY is not configured" },
      { status: 500 }
    );
  }

  if (!id || Number.isNaN(Number(id))) {
    return NextResponse.json(
      { error: "Invalid TV series ID" },
      { status: 400 }
    );
  }

  const session = await prisma.session.findUnique({
    where: { tmdb_session_id: sessionId },
  });

  try {
    await tmdbClient.delete(`/tv/${id}/rating`, {
      session_id: sessionId,
    });
  } catch {
    if (session) {
      await prisma.watchTimeEntry.deleteMany({
        where: {
          userId: session.userId,
          media_type: "tv",
          tmdb_movie_id: Number(id),
        },
      });
    }
    return NextResponse.json(
      { error: "Impossible de supprimer la note" },
      { status: 500 }
    );
  }

  if (session) {
    await prisma.watchTimeEntry.deleteMany({
      where: {
        userId: session.userId,
        media_type: "tv",
        tmdb_movie_id: Number(id),
      },
    });
  }

  return NextResponse.json({ success: true });
}
