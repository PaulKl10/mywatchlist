import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";
import type { TRatedMovie } from "@/types/movie.type";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

type TMDBRatedMoviesResponse = {
  page: number;
  results: (TRatedMovie & { rating?: number })[];
  total_pages: number;
  total_results: number;
};

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

    const { data } = await axios.get<TMDBRatedMoviesResponse>(
      `${TMDB_BASE_URL}/account/${accountId}/rated/movies`,
      {
        params: {
          api_key: apiKey,
          session_id: sessionId,
          page,
          language: "fr-FR",
        },
      }
    );

    const results: TRatedMovie[] = data.results.map((m: (typeof data.results)[number]) => ({
      ...m,
      rating: m.rating ?? 0,
    }));

    return NextResponse.json({
      page: data.page,
      results,
      total_pages: data.total_pages,
      total_results: data.total_results,
    });
  } catch {
    return NextResponse.json(
      { error: "Impossible de charger les films notés" },
      { status: 500 }
    );
  }
}
