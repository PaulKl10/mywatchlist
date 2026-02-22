import { NextResponse } from "next/server";
import axios from "axios";
import type { TDiscoverMoviesResponse } from "@/types/movie.type";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const page = searchParams.get("page") ?? "1";
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "TMDB_API_KEY is not configured" },
      { status: 500 }
    );
  }

  if (!query || query.trim() === "") {
    return NextResponse.json(
      { error: "Query is required" },
      { status: 400 }
    );
  }

  try {
    const { data } = await axios.get<TDiscoverMoviesResponse>(
      `${TMDB_BASE_URL}/search/movie`,
      {
        params: {
          api_key: apiKey,
          query: query.trim(),
          page,
          language: "fr-FR",
        },
      }
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to search movies from TMDB" },
      { status: 500 }
    );
  }
}
