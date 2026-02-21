import { NextResponse } from "next/server";
import axios from "axios";
import type { TDiscoverMoviesResponse } from "@/types/movie.type";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const TMDB_DISCOVER_PARAMS = [
  "page",
  "certification",
  "certification.gte",
  "certification.lte",
  "certification_country",
  "include_adult",
  "include_video",
  "language",
  "primary_release_year",
  "primary_release_date.gte",
  "primary_release_date.lte",
  "region",
  "release_date.gte",
  "release_date.lte",
  "sort_by",
  "vote_average.gte",
  "vote_average.lte",
  "vote_count.gte",
  "vote_count.lte",
  "watch_region",
  "with_cast",
  "with_companies",
  "with_crew",
  "with_genres",
  "with_keywords",
  "with_origin_country",
  "with_original_language",
  "with_people",
  "with_release_type",
  "with_runtime.gte",
  "with_runtime.lte",
  "with_watch_monetization_types",
  "with_watch_providers",
  "without_companies",
  "without_genres",
  "without_keywords",
  "without_watch_providers",
  "year",
] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "TMDB_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const params: Record<string, string | number | boolean> = {
    api_key: apiKey,
    language: searchParams.get("language") ?? "fr-FR",
    page: searchParams.get("page") ?? "1",
  };

  const numericParams = [
    "page",
    "primary_release_year",
    "with_release_type",
    "with_runtime.gte",
    "with_runtime.lte",
    "vote_average.gte",
    "vote_average.lte",
    "vote_count.gte",
    "vote_count.lte",
    "year",
  ];

  for (const key of TMDB_DISCOVER_PARAMS) {
    if (key === "language") continue;
    const value = searchParams.get(key);
    if (value !== null && value !== "") {
      if (key === "include_adult" || key === "include_video") {
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
    const { data } = await axios.get<TDiscoverMoviesResponse>(
      `${TMDB_BASE_URL}/discover/movie`,
      { params }
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch movies from TMDB" },
      { status: 500 }
    );
  }
}
