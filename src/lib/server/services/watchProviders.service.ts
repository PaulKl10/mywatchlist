import { tmdbClient } from "@/lib/tmdb-client";
import { WATCH_REGION } from "@/lib/movie-night/constants";
import type { TTmdbFlatrateProvider } from "@/lib/movie-night/deck";
import type { TMediaType } from "@/types/movie.type";

type TWatchProvidersResponse = {
  results?: Record<string, { flatrate?: TTmdbFlatrateProvider[] } | undefined>;
};

/** Plateformes qui proposent ce titre en abonnement en France (données JustWatch via TMDB). */
export async function fetchFrenchFlatrateIds(mediaType: TMediaType, tmdbId: number): Promise<number[]> {
  const data = await tmdbClient.get<TWatchProvidersResponse>(`/${mediaType}/${tmdbId}/watch/providers`);
  return (data.results?.[WATCH_REGION]?.flatrate ?? []).map((p) => p.provider_id);
}
