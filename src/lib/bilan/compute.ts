import type { TMediaType } from "@/types/movie.type";

/** TMDB ne date pas les notes : l'app les date depuis fin 2026, le bilan annuel commence en 2027. */
export const FIRST_YEARLY_BILAN = 2027;
const TOP_GENRES = 5;
const TOP_RATED = 6;

export type TBilanRating = {
  tmdbId: number;
  mediaType: TMediaType;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  genreIds: number[];
  /** Sur 10. */
  rating: number;
  ratedAt: Date | null;
};

export type TBilanTitle = Pick<TBilanRating, "tmdbId" | "mediaType" | "title" | "posterPath" | "rating">;

export type TBilanStats = {
  ratedMovies: number;
  ratedTv: number;
  totalMinutes: number;
  /** Arrondie au dixième ; null sans note. */
  averageRating: number | null;
  /** Genres des titres notés, du plus présent au moins présent. */
  topGenres: { id: number; count: number }[];
  topRated: TBilanTitle[];
  /** Ex. 1990 pour les années 90 ; null sans date de sortie connue. */
  favoriteDecade: { decade: number; count: number } | null;
};

function releaseYear(releaseDate: string | null): number | null {
  const year = releaseDate ? Number.parseInt(releaseDate.slice(0, 4), 10) : Number.NaN;
  return Number.isInteger(year) && year > 1800 ? year : null;
}

/** Statistiques du bilan à partir des notes de la période et du temps de visionnage compté. */
export function computeBilan(ratings: TBilanRating[], totalMinutes: number): TBilanStats {
  const genreCounts = new Map<number, number>();
  const decadeCounts = new Map<number, number>();
  for (const r of ratings) {
    for (const id of new Set(r.genreIds)) genreCounts.set(id, (genreCounts.get(id) ?? 0) + 1);
    const year = releaseYear(r.releaseDate);
    if (year !== null) {
      const decade = Math.floor(year / 10) * 10;
      decadeCounts.set(decade, (decadeCounts.get(decade) ?? 0) + 1);
    }
  }

  const topGenres = [...genreCounts]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id - b.id)
    .slice(0, TOP_GENRES);

  const favoriteDecade =
    [...decadeCounts]
      .map(([decade, count]) => ({ decade, count }))
      .sort((a, b) => b.count - a.count || b.decade - a.decade)[0] ?? null;

  const topRated = [...ratings]
    .sort(
      (a, b) =>
        b.rating - a.rating ||
        (b.ratedAt?.getTime() ?? 0) - (a.ratedAt?.getTime() ?? 0) ||
        a.title.localeCompare(b.title, "fr")
    )
    .slice(0, TOP_RATED)
    .map(({ tmdbId, mediaType, title, posterPath, rating }) => ({
      tmdbId,
      mediaType,
      title,
      posterPath,
      rating,
    }));

  const sum = ratings.reduce((total, r) => total + r.rating, 0);

  return {
    ratedMovies: ratings.filter((r) => r.mediaType === "movie").length,
    ratedTv: ratings.filter((r) => r.mediaType === "tv").length,
    totalMinutes,
    averageRating: ratings.length > 0 ? Math.round((sum / ratings.length) * 10) / 10 : null,
    topGenres,
    topRated,
    favoriteDecade,
  };
}

/** Années (≥ FIRST_YEARLY_BILAN) où l'utilisateur a des notes datées, de la plus récente à la plus ancienne. */
export function availableBilanYears(ratedDates: Date[]): number[] {
  const years = new Set(
    ratedDates.map((d) => d.getUTCFullYear()).filter((y) => y >= FIRST_YEARLY_BILAN)
  );
  return [...years].sort((a, b) => b - a);
}

/** Bornes d'une année : [1er janvier, 1er janvier suivant[, en UTC. */
export function yearRange(year: number): { start: Date; end: Date } {
  return { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year + 1, 0, 1)) };
}
