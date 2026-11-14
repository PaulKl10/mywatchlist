import { NextResponse } from "next/server";
import {
  getSessionId,
  getUserFromSessionId,
  recordWatchTime,
  removeWatchTime,
  syncWatchlistItem,
  updateTmdbWatchlist,
} from "@/lib/server/services";
import {
  isTmdbNotFoundError,
  tmdbClient,
  tmdbErrorMessage,
} from "@/lib/tmdb-client";
import type { TMediaType } from "@/types/movie.type";

type TRatingRouteContext = { params: Promise<{ id: string }> };

type TRatingHandlersConfig = {
  mediaType: TMediaType;
  /** Message renvoyé pour un ID invalide. */
  invalidIdMessage: string;
  /** Durée (en minutes) comptée dans le temps de visionnage, récupérée côté serveur. */
  fetchRuntime: (mediaId: number) => Promise<number | null>;
};

function parseMediaId(id: string): number | null {
  return /^\d+$/.test(id) ? Number(id) : null;
}

function isValidRating(value: unknown): value is number {
  return (
    typeof value === "number" &&
    value >= 0.5 &&
    value <= 10 &&
    (value * 2) % 1 === 0
  );
}

/**
 * Handlers POST (noter) / DELETE (retirer la note) communs aux films et aux séries.
 * La note est stockée sur TMDB ; le temps de visionnage est suivi en BDD.
 */
export function createRatingHandlers({
  mediaType,
  invalidIdMessage,
  fetchRuntime,
}: TRatingHandlersConfig) {
  async function POST(request: Request, { params }: TRatingRouteContext) {
    const { id } = await params;
    const sessionId = await getSessionId();

    if (!sessionId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!tmdbClient.isConfigured()) {
      return NextResponse.json(
        { error: "TMDB_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const mediaId = parseMediaId(id);
    if (mediaId === null) {
      return NextResponse.json({ error: invalidIdMessage }, { status: 400 });
    }

    let body: { value?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
    }

    const { value } = body;
    if (!isValidRating(value)) {
      return NextResponse.json(
        { error: "La note doit être entre 0.5 et 10 (par paliers de 0.5)" },
        { status: 400 }
      );
    }

    try {
      await tmdbClient.post(
        `/${mediaType}/${mediaId}/rating`,
        { value },
        { session_id: sessionId }
      );
    } catch {
      return NextResponse.json(
        { error: "Impossible d'ajouter la note" },
        { status: 500 }
      );
    }

    await applyRatingSideEffects(sessionId, mediaId);

    return NextResponse.json({ success: true });
  }

  /**
   * Suites d'une notation : le média noté sort de la watchlist (TMDB + copie en BDD)
   * et entre dans le temps de visionnage. Best effort : la note est déjà enregistrée
   * sur TMDB, un échec ici est loggé mais ne la fait pas échouer.
   */
  async function applyRatingSideEffects(sessionId: string, mediaId: number) {
    const [watchlistResult, dbResult] = await Promise.allSettled([
      // TMDB retire en principe un média noté de la watchlist, mais ce comportement
      // dépend d'un réglage du compte TMDB : on le fait explicitement.
      updateTmdbWatchlist(sessionId, mediaId, mediaType, false),
      getUserFromSessionId(sessionId).then(async (user) => {
        if (!user) return;
        // Durée toujours récupérée côté serveur : une valeur fournie par le client
        // permettrait de gonfler le compteur.
        const runtime = await fetchRuntime(mediaId);
        await Promise.all([
          syncWatchlistItem(user.id, mediaId, mediaType, false),
          recordWatchTime(user.id, mediaType, mediaId, runtime),
        ]);
      }),
    ]);

    if (watchlistResult.status === "rejected") {
      console.error(
        `[rating] Retrait de la watchlist TMDB impossible (${mediaType} ${mediaId})`,
        tmdbErrorMessage(watchlistResult.reason)
      );
    }
    if (dbResult.status === "rejected") {
      console.error(
        `[rating] Mise à jour watchlist/temps de visionnage en BDD impossible (${mediaType} ${mediaId})`,
        tmdbErrorMessage(dbResult.reason)
      );
    }
  }

  async function DELETE(_request: Request, { params }: TRatingRouteContext) {
    const { id } = await params;
    const sessionId = await getSessionId();

    if (!sessionId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!tmdbClient.isConfigured()) {
      return NextResponse.json(
        { error: "TMDB_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const mediaId = parseMediaId(id);
    if (mediaId === null) {
      return NextResponse.json({ error: invalidIdMessage }, { status: 400 });
    }

    try {
      await tmdbClient.delete(`/${mediaType}/${mediaId}/rating`, {
        session_id: sessionId,
      });
    } catch (error) {
      // 404 : la note n'existe déjà plus sur TMDB, on aligne le compteur.
      // Toute autre erreur : la note est toujours sur TMDB, le compteur doit rester intact.
      if (!isTmdbNotFoundError(error)) {
        return NextResponse.json(
          { error: "Impossible de supprimer la note" },
          { status: 500 }
        );
      }
    }

    const user = await getUserFromSessionId(sessionId);
    if (user) {
      await removeWatchTime(user.id, mediaType, mediaId);
    }

    return NextResponse.json({ success: true });
  }

  return { POST, DELETE };
}
