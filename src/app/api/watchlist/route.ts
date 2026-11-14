import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type {
  TDiscoverMoviesResponse,
  TWatchlistTvResponse,
} from "@/types/movie.type";
import { getUserFromSessionId, syncWatchlistItem } from "@/lib/server/services";
import { tmdbClient } from "@/lib/tmdb-client";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

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
    const account = await tmdbClient.get<{ id: number }>("/account", {
      session_id: sessionId,
    });
    const accountId = account.id;

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
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

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

  const validMediaType =
    media_type === "tv" ? "tv" : "movie";

  try {
    const account = await tmdbClient.get<{ id: number }>("/account", {
      session_id: sessionId,
    });
    const accountId = account.id;

    await tmdbClient.post(
      `/account/${accountId}/watchlist`,
      {
        media_type: validMediaType,
        media_id,
        watchlist,
      },
      { session_id: sessionId }
    );

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
