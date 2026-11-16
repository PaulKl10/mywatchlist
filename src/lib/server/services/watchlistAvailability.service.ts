import { prisma } from "@/lib/prisma";
import { tmdbClient, tmdbErrorMessage } from "@/lib/tmdb-client";
import { WATCH_REGION } from "@/lib/movie-night/constants";
import { pickProviderBadge, type TTmdbFlatrateProvider } from "@/lib/movie-night/deck";
import type { TMediaType } from "@/types/movie.type";
import type { TAvailableWatchlistItem } from "@/types/watchlist.type";

/** Médias de la watchlist vérifiés au plus (les plus récemment ajoutés). */
const MAX_ITEMS = 250;
/** Fiches de plateformes demandées en parallèle à TMDB. */
const CONCURRENCY = 10;

type TWatchProvidersResponse = {
  results?: Record<string, { flatrate?: TTmdbFlatrateProvider[] } | undefined>;
};

async function fetchFlatrate(mediaType: TMediaType, id: number): Promise<TTmdbFlatrateProvider[]> {
  const data = await tmdbClient.get<TWatchProvidersResponse>(`/${mediaType}/${id}/watch/providers`);
  return data.results?.[WATCH_REGION]?.flatrate ?? [];
}

/**
 * Médias de la watchlist (copie en base) inclus dans un abonnement parmi `providerIds`, en
 * France, du plus récemment ajouté au plus ancien. `truncated` si la watchlist dépasse
 * MAX_ITEMS. Un média dont TMDB ne renvoie pas les plateformes est omis.
 */
export async function getAvailableWatchlistItems(
  userId: string,
  mediaType: TMediaType,
  providerIds: number[]
): Promise<{ items: TAvailableWatchlistItem[]; truncated: boolean }> {
  if (providerIds.length === 0) return { items: [], truncated: false };

  const rows = await prisma.watchlistItem.findMany({
    where: { userId, media_type: mediaType },
    orderBy: { added_at: "desc" },
    take: MAX_ITEMS + 1,
  });
  const truncated = rows.length > MAX_ITEMS;
  const checked = rows.slice(0, MAX_ITEMS);
  const items: TAvailableWatchlistItem[] = [];

  for (let start = 0; start < checked.length; start += CONCURRENCY) {
    const batch = checked.slice(start, start + CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map((row) => fetchFlatrate(mediaType, row.tmdb_movie_id))
    );
    settled.forEach((result, i) => {
      if (result.status === "rejected") {
        console.error("[watchlist] Plateformes illisibles", tmdbErrorMessage(result.reason));
        return;
      }
      const provider = pickProviderBadge(result.value, providerIds);
      if (!provider) return;
      const row = batch[i];
      items.push({
        id: row.tmdb_movie_id,
        media_type: mediaType,
        title: row.title,
        poster_path: row.poster_path,
        release_date: row.release_date,
        vote_average: row.vote_average,
        overview: row.overview,
        provider,
      });
    });
  }

  return { items, truncated };
}
