import { prisma } from "@/lib/prisma";
import { tmdbClient, tmdbErrorMessage } from "@/lib/tmdb-client";
import {
  excludeKnown,
  mediaKey,
  pickSeeds,
  type TRatedTitle,
  type TSeed,
} from "@/lib/recommendations/seeds";
import type { TDiscoverTv, TMovie } from "@/types/movie.type";
import type { TRecommendationRow } from "@/types/recommendation.type";
import type { TCurrentSession } from "./session.service";
import { fetchAccountList } from "./tmdbAccount.service";

/**
 * Seule la page la plus récente des notes est lue sur TMDB, pour la « dernière bonne note » :
 * la copie en base n'a pas l'ordre des notes importées. Le reste vient de la copie.
 */
const LATEST_RATED_PAGES = 1;
/** Titres affichés au plus par rangée. */
const ROW_SIZE = 20;

type TRatedMovieItem = { id: number; title: string; rating: number };
type TRatedTvItem = { id: number; name: string; rating: number };
type TRecommendationsPage<T> = { results: T[]; total_pages: number };

/** Recommandations TMDB d'un titre : 1re page, plus la 2e si elle existe (des titres seront retirés). */
async function fetchRecommendations<T>(seed: TSeed): Promise<T[]> {
  const path = `/${seed.mediaType}/${seed.id}/recommendations`;
  const params = { language: "fr-FR" };
  const first = await tmdbClient.get<TRecommendationsPage<T>>(path, { ...params, page: 1 });
  if (first.total_pages < 2) return first.results;
  const second = await tmdbClient.get<TRecommendationsPage<T>>(path, { ...params, page: 2 });
  return [...first.results, ...second.results];
}

/** Garde la première occurrence de chaque titre. */
function uniqueTitles(titles: TRatedTitle[]): TRatedTitle[] {
  const seen = new Set<string>();
  return titles.filter((t) => {
    const key = mediaKey(t.mediaType, t.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

type TSeedRecommendations =
  | { mediaType: "movie"; items: TMovie[] }
  | { mediaType: "tv"; items: TDiscoverTv[] };

async function fetchSeedRecommendations(seed: TSeed): Promise<TSeedRecommendations> {
  return seed.mediaType === "tv"
    ? { mediaType: "tv", items: await fetchRecommendations<TDiscoverTv>(seed) }
    : { mediaType: "movie", items: await fetchRecommendations<TMovie>(seed) };
}

/**
 * Rangées « Parce que tu as aimé X » : recommandations TMDB de deux titres bien notés, sans ce
 * que l'utilisateur a déjà noté ou mis dans sa watchlist, ni un titre déjà dans une autre rangée.
 * Une rangée dont les recommandations n'ont pas pu être lues, ou vide, est omise.
 */
export async function getRecommendationRows(
  session: TCurrentSession
): Promise<TRecommendationRow[]> {
  const userId = session.user.id;
  const [latestMovies, latestTv, copiedRatings, watchlist] = await Promise.all([
    fetchAccountList<TRatedMovieItem>(session, "rated/movies", LATEST_RATED_PAGES),
    fetchAccountList<TRatedTvItem>(session, "rated/tv", LATEST_RATED_PAGES),
    prisma.ratingItem.findMany({
      where: { userId },
      select: { tmdb_id: true, media_type: true, title: true, rating: true },
    }),
    prisma.watchlistItem.findMany({
      where: { userId },
      select: { tmdb_movie_id: true, media_type: true },
    }),
  ]);

  const copied: TRatedTitle[] = copiedRatings.map((r) => ({
    id: r.tmdb_id,
    mediaType: r.media_type === "tv" ? "tv" : "movie",
    title: r.title,
    rating: r.rating,
  }));
  // Les notes les plus récentes d'abord (ordre TMDB), puis le reste de la copie.
  const ratedMovieTitles = uniqueTitles([
    ...latestMovies.items.map((m): TRatedTitle => ({
      id: m.id,
      mediaType: "movie",
      title: m.title,
      rating: m.rating,
    })),
    ...copied.filter((r) => r.mediaType === "movie"),
  ]);
  const ratedTvTitles = uniqueTitles([
    ...latestTv.items.map((tv): TRatedTitle => ({
      id: tv.id,
      mediaType: "tv",
      title: tv.name,
      rating: tv.rating,
    })),
    ...copied.filter((r) => r.mediaType === "tv"),
  ]);

  const known = new Set([
    ...[...ratedMovieTitles, ...ratedTvTitles].map((r) => mediaKey(r.mediaType, r.id)),
    ...watchlist.map((w) => mediaKey(w.media_type === "tv" ? "tv" : "movie", w.tmdb_movie_id)),
  ]);

  const seeds = pickSeeds(ratedMovieTitles, ratedTvTitles);
  const results = await Promise.allSettled(seeds.map(fetchSeedRecommendations));

  // Retire ce qui est connu, ou déjà dans une rangée précédente.
  const keepUnknown = <T extends { id: number }>(items: T[], seed: TSeed): T[] => {
    const kept = excludeKnown(items, seed.mediaType, known, ROW_SIZE);
    for (const item of kept) known.add(mediaKey(seed.mediaType, item.id));
    return kept;
  };

  const rows: TRecommendationRow[] = [];
  seeds.forEach((seed, i) => {
    const result = results[i];
    if (result.status === "rejected") {
      console.error("[recommendations] Lecture impossible", tmdbErrorMessage(result.reason));
      return;
    }
    const base = { seedId: seed.id, seedTitle: seed.title };
    const fetched = result.value;
    if (fetched.mediaType === "tv") {
      const tvShows = keepUnknown(fetched.items, seed);
      if (tvShows.length > 0) rows.push({ ...base, mediaType: "tv", tvShows });
    } else {
      const movies = keepUnknown(fetched.items, seed);
      if (movies.length > 0) rows.push({ ...base, mediaType: "movie", movies });
    }
  });

  return rows;
}
