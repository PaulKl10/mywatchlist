import { NextResponse } from "next/server";
import type { TMultiSearchResponse } from "@/types/search.type";
import { tmdbClient } from "@/lib/tmdb-client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const page = searchParams.get("page") ?? "1";

  if (!tmdbClient.isConfigured()) {
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
    const data = await tmdbClient.get<TMultiSearchResponse>("/search/multi", {
      query: query.trim(),
      page,
      language: "fr-FR",
      include_adult: false,
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to search from TMDB" },
      { status: 500 }
    );
  }
}
