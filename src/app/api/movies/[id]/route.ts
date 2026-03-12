import { NextResponse } from "next/server";
import type { TMovieDetails } from "@/types/movie.type";
import { tmdbClient } from "@/lib/tmdb-client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!tmdbClient.isConfigured()) {
    return NextResponse.json(
      { error: "TMDB_API_KEY is not configured" },
      { status: 500 }
    );
  }

  if (!id || Number.isNaN(Number(id))) {
    return NextResponse.json(
      { error: "Invalid movie ID" },
      { status: 400 }
    );
  }

  try {
    const data = await tmdbClient.get<TMovieDetails>(`/movie/${id}`, {
      language: "fr-FR",
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch movie details from TMDB" },
      { status: 500 }
    );
  }
}
