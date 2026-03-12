import { NextResponse } from "next/server";
import type { TDiscoverTvResponse } from "@/types/movie.type";
import { tmdbClient } from "@/lib/tmdb-client";

const TMDB_DISCOVER_TV_PARAMS = [
  "page",
  "first_air_date_year",
  "first_air_date.gte",
  "first_air_date.lte",
  "include_adult",
  "language",
  "sort_by",
  "vote_average.gte",
  "vote_average.lte",
  "vote_count.gte",
  "vote_count.lte",
  "with_genres",
  "with_networks",
  "with_origin_country",
  "with_original_language",
  "with_keywords",
  "with_watch_monetization_types",
  "with_watch_providers",
  "without_genres",
  "without_keywords",
  "without_watch_providers",
] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (!tmdbClient.isConfigured()) {
    return NextResponse.json(
      { error: "TMDB_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const params: Record<string, string | number | boolean> = {
    language: searchParams.get("language") ?? "fr-FR",
    page: searchParams.get("page") ?? "1",
  };

  const numericParams = [
    "page",
    "first_air_date_year",
    "vote_average.gte",
    "vote_average.lte",
    "vote_count.gte",
    "vote_count.lte",
  ];

  for (const key of TMDB_DISCOVER_TV_PARAMS) {
    if (key === "language") continue;
    const value = searchParams.get(key);
    if (value !== null && value !== "") {
      if (key === "include_adult") {
        params[key] = value === "true";
      } else if (numericParams.includes(key)) {
        const num = Number(value);
        if (!Number.isNaN(num)) params[key] = num;
      } else {
        params[key] = value;
      }
    }
  }

  try {
    const data = await tmdbClient.get<TDiscoverTvResponse>(
      "/discover/tv",
      params
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch TV series from TMDB" },
      { status: 500 }
    );
  }
}
