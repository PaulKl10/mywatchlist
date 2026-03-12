import { NextResponse } from "next/server";
import type { TPersonMovieCredits } from "@/types/movie.type";
import { tmdbClient } from "@/lib/tmdb-client";

type TMDBPersonMovieCreditsResponse = {
  cast: {
    id: number;
    title: string;
    poster_path: string | null;
    release_date: string;
    vote_average: number;
    character: string;
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
      { error: "Invalid person ID" },
      { status: 400 }
    );
  }

  try {
    const data = await tmdbClient.get<TMDBPersonMovieCreditsResponse>(
      `/person/${id}/movie_credits`,
      { language: "fr-FR" }
    );

    const response: TPersonMovieCredits = {
      cast: data.cast
        .sort((a, b) => {
          const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
          const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
          return dateB - dateA;
        })
        .map((c: (typeof data.cast)[number]) => ({
          id: c.id,
          title: c.title,
          poster_path: c.poster_path,
          release_date: c.release_date,
          vote_average: c.vote_average,
          character: c.character,
        })),
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch movie credits from TMDB" },
      { status: 500 }
    );
  }
}
