import { NextResponse } from "next/server";
import type { TWatchProviders } from "@/types/movie.type";
import { tmdbClient } from "@/lib/tmdb-client";

type TMDBCountryProviders = {
  link: string;
  flatrate?: {
    logo_path: string;
    provider_id: number;
    provider_name: string;
    display_priority: number;
  }[];
  buy?: {
    logo_path: string;
    provider_id: number;
    provider_name: string;
    display_priority: number;
  }[];
  rent?: {
    logo_path: string;
    provider_id: number;
    provider_name: string;
    display_priority: number;
  }[];
};

type TMDBWatchProvidersResponse = {
  id: number;
  results: Record<string, TMDBCountryProviders>;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country") || "FR";

  if (!tmdbClient.isConfigured()) {
    return NextResponse.json(
      { error: "TMDB_API_KEY is not configured" },
      { status: 500 }
    );
  }

  if (!id || Number.isNaN(Number(id))) {
    return NextResponse.json(
      { error: "Invalid TV series ID" },
      { status: 400 }
    );
  }

  try {
    const data = await tmdbClient.get<TMDBWatchProvidersResponse>(
      `/tv/${id}/watch/providers`
    );

    const countryData = data.results[country.toUpperCase()];

    if (!countryData) {
      return NextResponse.json<TWatchProviders>({
        link: `https://www.themoviedb.org/tv/${id}/watch`,
        flatrate: [],
        buy: [],
        rent: [],
      });
    }

    const response: TWatchProviders = {
      link: countryData.link,
      flatrate: countryData.flatrate ?? [],
      buy: countryData.buy ?? [],
      rent: countryData.rent ?? [],
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch watch providers from TMDB" },
      { status: 500 }
    );
  }
}
