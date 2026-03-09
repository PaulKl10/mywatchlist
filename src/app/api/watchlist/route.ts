import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";
import type { TDiscoverMoviesResponse } from "@/types/movie.type";
import { getUserFromSessionId, syncWatchlistItem } from "@/lib/server/services";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(request: Request) {
  const apiKey = process.env.TMDB_API_KEY;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  if (!apiKey || !sessionId) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") ?? "1";

  try {
    const accountRes = await axios.get(`${TMDB_BASE_URL}/account`, {
      params: { api_key: apiKey, session_id: sessionId },
    });
    const accountId = accountRes.data.id;

    const { data } = await axios.get<TDiscoverMoviesResponse>(
      `${TMDB_BASE_URL}/account/${accountId}/watchlist/movies`,
      {
        params: {
          api_key: apiKey,
          session_id: sessionId,
          page,
          language: "fr-FR",
        },
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
  const apiKey = process.env.TMDB_API_KEY;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("tmdb_session_id")?.value;

  if (!apiKey || !sessionId) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { media_id, watchlist } = body as {
    media_id: number;
    watchlist: boolean;
  };

  if (typeof media_id !== "number" || typeof watchlist !== "boolean") {
    return NextResponse.json(
      { error: "media_id et watchlist requis" },
      { status: 400 }
    );
  }

  try {
    const accountRes = await axios.get(`${TMDB_BASE_URL}/account`, {
      params: { api_key: apiKey, session_id: sessionId },
    });
    const accountId = accountRes.data.id;

    await axios.post(
      `${TMDB_BASE_URL}/account/${accountId}/watchlist`,
      {
        media_type: "movie",
        media_id,
        watchlist,
      },
      {
        params: { api_key: apiKey, session_id: sessionId },
        headers: { "Content-Type": "application/json" },
      }
    );

    const user = await getUserFromSessionId(sessionId);
    if (user) {
      await syncWatchlistItem(user.id, media_id, watchlist);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible de modifier la watchlist" },
      { status: 500 }
    );
  }
}
