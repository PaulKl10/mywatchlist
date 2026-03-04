import { NextResponse } from "next/server";
import axios from "axios";
import type { TMovieCredits } from "@/types/movie.type";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

type TMDBMovieCreditsResponse = {
  id: number;
  cast: {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
  }[];
};

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
    const { data } = await axios.get<TMDBMovieCreditsResponse>(
      `${TMDB_BASE_URL}/movie/${id}/credits`,
      {
        params: { api_key: apiKey, language: "fr-FR" },
      }
    );

    const response: TMovieCredits = {
      cast: data.cast.map((c: (typeof data.cast)[number]) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profile_path: c.profile_path,
        order: c.order,
      })),
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch credits from TMDB" },
      { status: 500 }
    );
  }
}
