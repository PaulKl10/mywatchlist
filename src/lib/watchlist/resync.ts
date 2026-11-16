import type { TMediaType } from "@/types/movie.type";
import { isSameSnapshot, type TWatchlistSnapshot } from "./snapshot";

const MEDIA_TYPES: readonly TMediaType[] = ["movie", "tv"];

/** Média de la copie en base. */
export type TLocalWatchlistItem = {
  tmdbId: number;
  mediaType: TMediaType;
  addedAt: Date;
  snapshot: TWatchlistSnapshot;
};

/** Watchlist TMDB d'un type de média, du plus récent au plus ancien ajout. */
export type TRemoteWatchlistList = {
  items: { tmdbId: number; snapshot: TWatchlistSnapshot }[];
  /** false si toutes les pages n'ont pas été lues : rien n'est alors supprimé pour ce type. */
  complete: boolean;
};

export type TRemoteWatchlist = Record<TMediaType, TRemoteWatchlistList>;

type TMediaKey = { tmdbId: number; mediaType: TMediaType };

export type TWatchlistResyncPlan = {
  creates: (TMediaKey & { snapshot: TWatchlistSnapshot; addedAt: Date })[];
  updates: (TMediaKey & { snapshot: TWatchlistSnapshot })[];
  deletes: TMediaKey[];
};

const keyOf = (mediaType: TMediaType, tmdbId: number) => `${mediaType}:${tmdbId}`;

/**
 * Écarts entre la copie en base et la watchlist TMDB. Seuls les médias nouveaux ou dont les
 * données ont changé sont écrits.
 *
 * TMDB ne donne pas la date d'ajout, seulement l'ordre. Un média ajouté hors de l'app reçoit
 * donc une date juste antérieure à celle de son voisin plus récent (ou à `now` s'il est en
 * tête) : l'ordre de la copie suit celui de TMDB sans changer les dates connues.
 */
export function planWatchlistResync(
  local: TLocalWatchlistItem[],
  remote: TRemoteWatchlist,
  now: Date
): TWatchlistResyncPlan {
  const localByKey = new Map(local.map((item) => [keyOf(item.mediaType, item.tmdbId), item]));
  const plan: TWatchlistResyncPlan = { creates: [], updates: [], deletes: [] };

  for (const mediaType of MEDIA_TYPES) {
    const { items, complete } = remote[mediaType];
    const seen = new Set<string>();
    let ceiling = now.getTime();

    for (const { tmdbId, snapshot } of items) {
      const key = keyOf(mediaType, tmdbId);
      if (seen.has(key)) continue;
      seen.add(key);

      const existing = localByKey.get(key);
      if (existing) {
        ceiling = Math.min(ceiling, existing.addedAt.getTime());
        if (!isSameSnapshot(existing.snapshot, snapshot)) {
          plan.updates.push({ tmdbId, mediaType, snapshot });
        }
      } else {
        ceiling -= 1;
        plan.creates.push({ tmdbId, mediaType, snapshot, addedAt: new Date(ceiling) });
      }
    }

    if (!complete) continue;
    for (const item of local) {
      if (item.mediaType === mediaType && !seen.has(keyOf(mediaType, item.tmdbId))) {
        plan.deletes.push({ tmdbId: item.tmdbId, mediaType });
      }
    }
  }

  return plan;
}
