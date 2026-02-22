import { NextResponse } from "next/server";
import axios from "axios";
import type { TMovieDetails } from "@/types/movie.type";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
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
    const { data } = await axios.get<TMovieDetails>(
      `${TMDB_BASE_URL}/movie/${id}`,
      {
        params: { api_key: apiKey, language: "fr-FR" },
      }
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch movie details from TMDB" },
      { status: 500 }
    );
  }
}
