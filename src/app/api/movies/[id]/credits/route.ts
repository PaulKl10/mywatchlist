import { NextResponse } from "next/server";
import type { TMovieCredits } from "@/types/movie.type";
import { tmdbClient } from "@/lib/tmdb-client";

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
    const data = await tmdbClient.get<TMDBMovieCreditsResponse>(
      `/movie/${id}/credits`,
      { language: "fr-FR" }
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
