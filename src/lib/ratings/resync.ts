import type { TMediaType } from "@/types/movie.type";

const MEDIA_TYPES: readonly TMediaType[] = ["movie", "tv"];

/** Note et données du titre gardées dans la copie des notes (table RatingItem). */
export type TRatingSnapshot = {
  rating: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  genre_ids: number[];
};

type TMediaKey = { tmdbId: number; mediaType: TMediaType };

export type TLocalRating = TMediaKey & { snapshot: TRatingSnapshot; ratedAt: Date | null };

/** Notes TMDB d'un type de média ; `complete` à false si toutes les pages n'ont pas été lues. */
export type TRemoteRatingList = {
  items: { tmdbId: number; snapshot: TRatingSnapshot }[];
  complete: boolean;
};

export type TRemoteRatings = Record<TMediaType, TRemoteRatingList>;

export type TRatingsResyncPlan = {
  /** `ratedAt` null pour l'import initial : TMDB ne donne pas la date d'une note. */
  creates: (TMediaKey & { snapshot: TRatingSnapshot; ratedAt: Date | null })[];
  /** `ratedAt` présent seulement quand une note sans date change (hors import initial). */
  updates: (TMediaKey & { snapshot: TRatingSnapshot; ratedAt?: Date })[];
  deletes: TMediaKey[];
  /** Notes données ou changées hors de l'app depuis la dernière resynchro, pour le fil d'activité. */
  activities: (TMediaKey & { snapshot: TRatingSnapshot })[];
};

const keyOf = (mediaType: TMediaType, tmdbId: number) => `${mediaType}:${tmdbId}`;

function isSameSnapshot(a: TRatingSnapshot, b: TRatingSnapshot): boolean {
  return (
    a.rating === b.rating &&
    a.title === b.title &&
    a.poster_path === b.poster_path &&
    a.release_date === b.release_date &&
    a.genre_ids.length === b.genre_ids.length &&
    a.genre_ids.every((id, i) => id === b.genre_ids[i])
  );
}

/**
 * Écarts entre la copie des notes et TMDB. À l'import initial, les notes ajoutées n'ont pas
 * de date et rien n'entre dans le fil d'activité (sinon tout l'historique y arriverait d'un
 * coup). Ensuite, une note nouvelle est datée de `now` ; une note changée garde sa date.
 */
export function planRatingsResync(
  local: TLocalRating[],
  remote: TRemoteRatings,
  now: Date,
  isInitialImport: boolean
): TRatingsResyncPlan {
  const localByKey = new Map(local.map((item) => [keyOf(item.mediaType, item.tmdbId), item]));
  const plan: TRatingsResyncPlan = { creates: [], updates: [], deletes: [], activities: [] };

  for (const mediaType of MEDIA_TYPES) {
    const { items, complete } = remote[mediaType];
    const seen = new Set<string>();

    for (const { tmdbId, snapshot } of items) {
      const key = keyOf(mediaType, tmdbId);
      if (seen.has(key)) continue;
      seen.add(key);

      const existing = localByKey.get(key);
      if (!existing) {
        plan.creates.push({ tmdbId, mediaType, snapshot, ratedAt: isInitialImport ? null : now });
        if (!isInitialImport) plan.activities.push({ tmdbId, mediaType, snapshot });
      } else if (existing.snapshot.rating !== snapshot.rating) {
        // Une note changée garde sa première date ; une note importée sans date prend celle-ci.
        const dateIt = !isInitialImport && existing.ratedAt === null;
        plan.updates.push({ tmdbId, mediaType, snapshot, ...(dateIt && { ratedAt: now }) });
        if (!isInitialImport) plan.activities.push({ tmdbId, mediaType, snapshot });
      } else if (!isSameSnapshot(existing.snapshot, snapshot)) {
        plan.updates.push({ tmdbId, mediaType, snapshot });
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
