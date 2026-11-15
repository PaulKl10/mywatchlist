import { prisma } from "@/lib/prisma";
import { tmdbClient } from "@/lib/tmdb-client";
import { DECK_EXTRA_DETAILS, WATCH_REGION } from "@/lib/movie-night/constants";
import {
  buildDiscoverParams,
  keepAvailableMovies,
  pickProviderBadge,
  selectDeckMovieIds,
  shufflePageOrder,
  type TTmdbFlatrateProvider,
} from "@/lib/movie-night/deck";
import type { TDeckMovie, TStreamingProvider } from "@/lib/movie-night/types";

const PAGE_BATCH_SIZE = 3;

type TTmdbProviderListItem = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
  display_priorities?: Record<string, number>;
};

type TDiscoverPage = { total_pages: number; results: { id: number }[] };

type TMovieDetails = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string | null;
  vote_average: number;
  runtime: number | null;
  genres?: { id: number }[];
  overview: string;
  "watch/providers"?: {
    results?: Record<string, { flatrate?: TTmdbFlatrateProvider[] } | undefined>;
  };
};

/** Plateformes de streaming disponibles en France, triées par priorité FR. */
export async function fetchFrenchStreamingProviders(): Promise<TStreamingProvider[]> {
  const data = await tmdbClient.get<{ results: TTmdbProviderListItem[] }>(
    "/watch/providers/movie",
    { watch_region: WATCH_REGION, language: "fr-FR" }
  );
  const priority = (p: TTmdbProviderListItem) =>
    p.display_priorities?.[WATCH_REGION] ?? p.display_priority;
  return [...data.results]
    .sort((a, b) => priority(a) - priority(b))
    .map((p) => ({ id: p.provider_id, name: p.provider_name, logoPath: p.logo_path }));
}

/** Ids TMDB des films notés (donc vus) par au moins un des utilisateurs. */
export async function getSeenMovieIds(userIds: string[]): Promise<number[]> {
  if (userIds.length === 0) return [];
  const entries = await prisma.watchTimeEntry.findMany({
    where: { userId: { in: userIds }, media_type: "movie" },
    select: { tmdb_movie_id: true },
    distinct: ["tmdb_movie_id"],
  });
  return entries.map((e) => e.tmdb_movie_id);
}

async function fetchMovieSnapshot(
  id: number,
  providerIds: number[]
): Promise<TDeckMovie> {
  const movie = await tmdbClient.get<TMovieDetails>(`/movie/${id}`, {
    language: "fr-FR",
    append_to_response: "watch/providers",
  });
  const flatrate = movie["watch/providers"]?.results?.[WATCH_REGION]?.flatrate ?? [];
  return {
    id: movie.id,
    title: movie.title,
    posterPath: movie.poster_path,
    releaseDate: movie.release_date || null,
    voteAverage: movie.vote_average,
    runtime: movie.runtime ?? null,
    genreIds: (movie.genres ?? []).map((g) => g.id),
    overview: movie.overview,
    provider: pickProviderBadge(flatrate, providerIds),
  };
}

/**
 * Construit une pile de films : discover TMDB sur des pages tirées au hasard,
 * exclusions, mélange, puis instantané détaillé de chaque film retenu.
 * Les erreurs TMDB de discover remontent ; un film dont la fiche échoue est retiré, comme
 * un film que sa fiche ne montre inclus dans aucun abonnement choisi (location ou achat
 * seulement). `DECK_EXTRA_DETAILS` fiches de plus compensent ces retraits.
 */
export async function buildDeck(args: {
  providerIds: number[];
  genreIds: number[];
  deckSize: number;
  excludedMovieIds: number[];
}): Promise<TDeckMovie[]> {
  const { providerIds, genreIds, deckSize, excludedMovieIds } = args;
  const excluded = new Set(excludedMovieIds);
  const wanted = 2 * deckSize;

  const fetchPage = (page: number) =>
    tmdbClient.get<TDiscoverPage>(
      "/discover/movie",
      buildDiscoverParams({ providerIds, genreIds, page })
    );

  const firstPage = await fetchPage(1);
  const pageOrder = shufflePageOrder(firstPage.total_pages);
  const pagesById = new Map<number, number[]>([[1, firstPage.results.map((m) => m.id)]]);
  const candidates = new Set<number>();
  const countUsable = () => [...candidates].filter((id) => !excluded.has(id)).length;

  let cursor = 0;
  while (cursor < pageOrder.length) {
    const batch = pageOrder.slice(cursor, cursor + PAGE_BATCH_SIZE);
    cursor += PAGE_BATCH_SIZE;
    const pages = await Promise.all(
      batch.map(async (page) => {
        const cached = pagesById.get(page);
        if (cached) return cached;
        return (await fetchPage(page)).results.map((m) => m.id);
      })
    );
    for (const id of pages.flat()) candidates.add(id);
    if (countUsable() >= wanted) break;
  }

  const ids = selectDeckMovieIds([...candidates], excluded, deckSize + DECK_EXTRA_DETAILS);
  const settled = await Promise.allSettled(
    ids.map((id) => fetchMovieSnapshot(id, providerIds))
  );
  const snapshots = settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  return keepAvailableMovies(snapshots, deckSize);
}
