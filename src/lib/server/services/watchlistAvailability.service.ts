import { prisma } from "@/lib/prisma";
import { tmdbErrorMessage } from "@/lib/tmdb-client";
import type { TMediaType } from "@/types/movie.type";
import type { TAvailableWatchlistItem } from "@/types/watchlist.type";
import { fetchFrenchStreamingProviders } from "./movieNightDeck.service";
import { fetchFrenchFlatrateIds } from "./watchProviders.service";

/** Médias de la watchlist vérifiés au plus (les plus récemment ajoutés). */
const MAX_ITEMS = 250;
/** Fiches de plateformes demandées en parallèle à TMDB. */
const CONCURRENCY = 10;
/** Un relevé quotidien (alerte « enfin dispo ») plus récent que ça est réutilisé tel quel. */
const FRESH_FOR_MS = 26 * 60 * 60 * 1000;

/**
 * Médias de la watchlist (copie en base) inclus dans un abonnement parmi `providerIds`, en
 * France, du plus récemment ajouté au plus ancien. `truncated` si la watchlist dépasse
 * MAX_ITEMS. Les relevés quotidiens récents évitent de relire TMDB ; ils ne sont jamais écrits
 * ici, sinon le passage quotidien manquerait l'arrivée d'un titre sur une plateforme.
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

  const [snapshots, providers] = await Promise.all([
    prisma.titleAvailability.findMany({
      where: {
        media_type: mediaType,
        tmdb_id: { in: checked.map((row) => row.tmdb_movie_id) },
        checked_at: { gte: new Date(Date.now() - FRESH_FOR_MS) },
      },
    }),
    fetchFrenchStreamingProviders(),
  ]);
  const freshIds = new Map(snapshots.map((s) => [s.tmdb_id, s.provider_ids]));

  // Badge : la plateforme de l'utilisateur la plus prioritaire en France.
  const mine = providers.filter((p) => providerIds.includes(p.id));
  const items: TAvailableWatchlistItem[] = [];

  for (let start = 0; start < checked.length; start += CONCURRENCY) {
    const batch = checked.slice(start, start + CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map(
        (row) =>
          freshIds.get(row.tmdb_movie_id) ?? fetchFrenchFlatrateIds(mediaType, row.tmdb_movie_id)
      )
    );
    settled.forEach((result, i) => {
      if (result.status === "rejected") {
        console.error("[watchlist] Plateformes illisibles", tmdbErrorMessage(result.reason));
        return;
      }
      const provider = mine.find((p) => result.value.includes(p.id));
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
