import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  closeSuggestion,
  getCurrentSession,
  syncWatchlistItem,
  updateTmdbWatchlist,
} from "@/lib/server/services";
import { parseDeclineReason } from "@/lib/suggestions/declineReasons";
import { tmdbClient } from "@/lib/tmdb-client";
import type { TMediaType } from "@/types/movie.type";

type TSuggestionRouteContext = { params: Promise<{ id: string }> };

/**
 * Accepter une suggestion : ajout à la watchlist (TMDB + BDD), puis suppression de la
 * suggestion et notification de son auteur.
 */
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
      current,
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

    // Déjà traitée ailleurs entre-temps : l'ajout à la watchlist reste, sans nouvelle notification.
    await closeSuggestion(suggestion, current.user, { accepted: true });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible d'ajouter à la watchlist" },
      { status: 500 }
    );
  }
}

/** Refuser une suggestion, avec un motif (`{ reason }`) transmis à son auteur. */
export async function DELETE(request: Request, { params }: TSuggestionRouteContext) {
  const { id } = await params;
  const current = await getCurrentSession();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { reason?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const reason = parseDeclineReason(body?.reason);
  if (!reason) {
    return NextResponse.json({ error: "Motif de refus requis" }, { status: 400 });
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

  try {
    const closed = await closeSuggestion(suggestion, current.user, { accepted: false, reason });
    if (!closed) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Impossible de refuser la suggestion" }, { status: 500 });
  }
}
