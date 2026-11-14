import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentSession,
  syncWatchlistItem,
  updateTmdbWatchlist,
} from "@/lib/server/services";
import { tmdbClient } from "@/lib/tmdb-client";
import type { TMediaType } from "@/types/movie.type";

type TSuggestionRouteContext = { params: Promise<{ id: string }> };

/** Accepter une suggestion : ajout à la watchlist (TMDB + BDD) puis suppression de la suggestion. */
export async function PATCH(_request: Request, { params }: TSuggestionRouteContext) {
  const { id } = await params;
  const current = await getCurrentSession();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suggestion = await prisma.suggestion.findUnique({
    where: { id },
  });

  if (!suggestion) {
    return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  }

  if (suggestion.toUserId !== current.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!tmdbClient.isConfigured()) {
    return NextResponse.json(
      { error: "TMDB_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const mediaType: TMediaType = suggestion.media_type === "tv" ? "tv" : "movie";

  try {
    await updateTmdbWatchlist(
      current.sessionId,
      suggestion.tmdb_movie_id,
      mediaType,
      true
    );
    await syncWatchlistItem(
      current.user.id,
      suggestion.tmdb_movie_id,
      mediaType,
      true
    );

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

/** Refuser une suggestion. */
export async function DELETE(_request: Request, { params }: TSuggestionRouteContext) {
  const { id } = await params;
  const current = await getCurrentSession();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suggestion = await prisma.suggestion.findUnique({
    where: { id },
  });

  if (!suggestion) {
    return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  }

  if (suggestion.toUserId !== current.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.suggestion.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
