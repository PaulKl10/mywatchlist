import type { TMediaType } from "@/types/movie.type";

/** Note (sur 10) à partir de laquelle un titre compte comme « aimé ». */
export const LIKED_MIN_RATING = 7;

export type TRatedTitle = {
  id: number;
  mediaType: TMediaType;
  title: string;
  rating: number;
};

/** Titre aimé dont on affiche les recommandations. */
export type TSeed = Pick<TRatedTitle, "id" | "mediaType" | "title">;

export const mediaKey = (mediaType: TMediaType, id: number) => `${mediaType}:${id}`;

/** Dernières bonnes notes (par type de média) parmi lesquelles la 1re rangée est tirée. */
export const RECENT_LIKED_COUNT = 5;

/**
 * Deux points de départ : un titre tiré au hasard parmi les dernières bonnes notes (les 5
 * derniers films et les 5 dernières séries : TMDB ne dit pas si un film a été noté avant ou
 * après une série), pour que la 1re rangée suive les envies du moment sans rester figée ; puis
 * un coup de cœur tiré au hasard parmi tous les autres. Les listes vont de la note la plus
 * récente à la plus ancienne.
 */
export function pickSeeds(
  ratedMovies: TRatedTitle[],
  ratedTv: TRatedTitle[],
  random: () => number = Math.random
): TSeed[] {
  const liked = (list: TRatedTitle[]) => list.filter((r) => r.rating >= LIKED_MIN_RATING);
  const likedMovies = liked(ratedMovies);
  const likedTv = liked(ratedTv);

  const recent = [
    ...likedMovies.slice(0, RECENT_LIKED_COUNT),
    ...likedTv.slice(0, RECENT_LIKED_COUNT),
  ];
  if (recent.length === 0) return [];
  const first = recent[Math.floor(random() * recent.length)];

  const others = [...likedMovies, ...likedTv].filter(
    (r) => mediaKey(r.mediaType, r.id) !== mediaKey(first.mediaType, first.id)
  );
  const picks = [first];
  if (others.length > 0) picks.push(others[Math.floor(random() * others.length)]);

  return picks.map(({ id, mediaType, title }) => ({ id, mediaType, title }));
}

/** Garde au plus `limit` titres, sans ceux de `known` ni doublons. */
export function excludeKnown<T extends { id: number }>(
  items: T[],
  mediaType: TMediaType,
  known: ReadonlySet<string>,
  limit: number
): T[] {
  const seen = new Set<number>();
  const kept: T[] = [];
  for (const item of items) {
    if (kept.length >= limit) break;
    if (seen.has(item.id) || known.has(mediaKey(mediaType, item.id))) continue;
    seen.add(item.id);
    kept.push(item);
  }
  return kept;
}
