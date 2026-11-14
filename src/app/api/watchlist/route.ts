import { NextResponse } from "next/server";
import type {
  TDiscoverMoviesResponse,
  TMediaType,
  TWatchlistTvResponse,
} from "@/types/movie.type";
import {
  getSessionId,
  getUserFromSessionId,
  syncWatchlistItem,
  updateTmdbWatchlist,
} from "@/lib/server/services";
import { getTmdbAccountId } from "@/lib/tmdb";
import { tmdbClient } from "@/lib/tmdb-client";

export async function GET(request: Request) {
  const sessionId = await getSessionId();

  if (!sessionId) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  if (!tmdbClient.isConfigured()) {
    return NextResponse.json(
      { error: "TMDB_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") ?? "1";
  const mediaType = searchParams.get("media_type") ?? "movie";

  try {
    const accountId = await getTmdbAccountId(sessionId);

    if (mediaType === "tv") {
      const data = await tmdbClient.get<TWatchlistTvResponse>(
        `/account/${accountId}/watchlist/tv`,
        {
          session_id: sessionId,
          page,
          language: "fr-FR",
        }
      );
      return NextResponse.json(data);
    }

    const data = await tmdbClient.get<TDiscoverMoviesResponse>(
      `/account/${accountId}/watchlist/movies`,
      {
        session_id: sessionId,
        page,
        language: "fr-FR",
      }
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Impossible de charger la watchlist" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const sessionId = await getSessionId();

  if (!sessionId) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  if (!tmdbClient.isConfigured()) {
    return NextResponse.json(
      { error: "TMDB_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: { media_id?: unknown; watchlist?: unknown; media_type?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }
  const { media_id, watchlist, media_type = "movie" } = body;

  if (typeof media_id !== "number" || typeof watchlist !== "boolean") {
    return NextResponse.json(
      { error: "media_id et watchlist requis" },
      { status: 400 }
    );
  }

  const validMediaType: TMediaType = media_type === "tv" ? "tv" : "movie";

  try {
    await updateTmdbWatchlist(sessionId, media_id, validMediaType, watchlist);

    const user = await getUserFromSessionId(sessionId);
    if (user) {
      await syncWatchlistItem(user.id, media_id, validMediaType, watchlist);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible de modifier la watchlist" },
      { status: 500 }
    );
  }
}
