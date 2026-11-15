import { DISCOVER_MAX_PAGE, MIN_VOTE_COUNT, WATCH_REGION } from "./constants";
import type { TDeckMovie } from "./types";

export type TTmdbFlatrateProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
};

/** Paramètres TMDB discover : plateformes et genres en OU, abonnement uniquement. */
export function buildDiscoverParams(args: {
  providerIds: number[];
  genreIds: number[];
  page: number;
}): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {
    with_watch_providers: args.providerIds.join("|"),
    watch_region: WATCH_REGION,
    with_watch_monetization_types: "flatrate",
    sort_by: "popularity.desc",
    "vote_count.gte": MIN_VOTE_COUNT,
    include_adult: false,
    language: "fr-FR",
    page: args.page,
  };
  if (args.genreIds.length > 0) params.with_genres = args.genreIds.join("|");
  return params;
}

function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Ordre aléatoire des pages 1..min(totalPages, DISCOVER_MAX_PAGE). */
export function shufflePageOrder(totalPages: number, random: () => number = Math.random): number[] {
  const count = Math.min(Math.floor(totalPages), DISCOVER_MAX_PAGE);
  if (!(count >= 1)) return [];
  return shuffle(Array.from({ length: count }, (_, i) => i + 1), random);
}

export function selectDeckMovieIds(
  candidateIds: number[],
  excludedIds: ReadonlySet<number>,
  deckSize: number,
  shuffleFn: <T>(items: T[]) => T[] = shuffle,
): number[] {
  const unique = [...new Set(candidateIds)].filter((id) => !excludedIds.has(id));
  return shuffleFn(unique).slice(0, deckSize);
}

export function pickProviderBadge(
  flatrate: TTmdbFlatrateProvider[],
  chosenProviderIds: number[],
): TDeckMovie["provider"] {
  const chosen = new Set(chosenProviderIds);
  let best: TTmdbFlatrateProvider | null = null;
  for (const p of flatrate) {
    if (chosen.has(p.provider_id) && (!best || p.display_priority < best.display_priority)) best = p;
  }
  return best ? { id: best.provider_id, name: best.provider_name, logoPath: best.logo_path } : null;
}
