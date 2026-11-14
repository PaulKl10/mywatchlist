import { NextResponse } from "next/server";
import type { TRatedMovie, TRatedTv } from "@/types/movie.type";
import { getCurrentSession } from "@/lib/server/services";
import { tmdbClient } from "@/lib/tmdb-client";

type TMDBRatedMoviesResponse = {
  page: number;
  results: (TRatedMovie & { rating?: number })[];
  total_pages: number;
  total_results: number;
};

type TMDBRatedTvResponse = {
  page: number;
  results: (Omit<TRatedTv, "rating"> & { rating?: number })[];
  total_pages: number;
  total_results: number;
};

export async function GET(request: Request) {
  const current = await getCurrentSession();

  if (!current) {
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
    const { sessionId, user } = current;
    const accountId = user.tmdb_id;

    if (mediaType === "tv") {
      const data = await tmdbClient.get<TMDBRatedTvResponse>(
        `/account/${accountId}/rated/tv`,
        {
          session_id: sessionId,
          page,
          language: "fr-FR",
        }
      );

      const results: TRatedTv[] = data.results.map((m) => ({
        ...m,
        rating: m.rating ?? 0,
      }));

      return NextResponse.json({
        page: data.page,
        results,
        total_pages: data.total_pages,
        total_results: data.total_results,
      });
    }

    const data = await tmdbClient.get<TMDBRatedMoviesResponse>(
      `/account/${accountId}/rated/movies`,
      {
        session_id: sessionId,
        page,
        language: "fr-FR",
      }
    );

    const results: TRatedMovie[] = data.results.map((m) => ({
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
      { error: "Impossible de charger les notes" },
      { status: 500 }
    );
  }
}
