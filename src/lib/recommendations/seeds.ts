import type { TMediaType } from "@/types/movie.type";

/** Note (sur 10) à partir de laquelle un titre compte comme « aimé ». */
export const LIKED_MIN_RATING = 8;

export type TRatedTitle = {
  id: number;
  mediaType: TMediaType;
  title: string;
  rating: number;
};

/** Titre aimé dont on affiche les recommandations. */
export type TSeed = Pick<TRatedTitle, "id" | "mediaType" | "title">;

export const mediaKey = (mediaType: TMediaType, id: number) => `${mediaType}:${id}`;

/**
 * Deux points de départ : la dernière bonne note, puis un coup de cœur tiré au hasard parmi
 * les autres. Les listes vont de la note la plus récente à la plus ancienne. TMDB ne dit pas
 * si un film a été noté avant ou après une série : la dernière bonne note est celle d'un film,
 * ou d'une série s'il n'y a aucun film bien noté.
 */
export function pickSeeds(
  ratedMovies: TRatedTitle[],
  ratedTv: TRatedTitle[],
  random: () => number = Math.random
): TSeed[] {
  const liked = (list: TRatedTitle[]) => list.filter((r) => r.rating >= LIKED_MIN_RATING);
  const likedMovies = liked(ratedMovies);
  const likedTv = liked(ratedTv);

  const latest = likedMovies[0] ?? likedTv[0];
  if (!latest) return [];

  const others = [...likedMovies, ...likedTv].filter(
    (r) => mediaKey(r.mediaType, r.id) !== mediaKey(latest.mediaType, latest.id)
  );
  const picks = [latest];
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
