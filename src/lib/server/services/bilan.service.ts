import { prisma } from "@/lib/prisma";
import {
  availableBilanYears,
  computeBilan,
  FIRST_YEARLY_BILAN,
  yearRange,
} from "@/lib/bilan/compute";
import type { TBilanResponse } from "@/types/bilan.type";

/** Bilan de `userId` sur une année, ou depuis toujours (`year` null). */
export async function getBilan(userId: string, year: number | null): Promise<TBilanResponse> {
  const range = year === null ? null : yearRange(year);
  const ratedAt = range ? { gte: range.start, lt: range.end } : undefined;

  const [ratings, watchTime, datedRatings] = await Promise.all([
    prisma.ratingItem.findMany({ where: { userId, ...(ratedAt && { rated_at: ratedAt }) } }),
    prisma.watchTimeEntry.aggregate({
      where: { userId, ...(range && { created_at: { gte: range.start, lt: range.end } }) },
      _sum: { runtime: true },
    }),
    prisma.ratingItem.findMany({
      where: { userId, rated_at: { gte: yearRange(FIRST_YEARLY_BILAN).start } },
      select: { rated_at: true },
    }),
  ]);

  const stats = computeBilan(
    ratings.map((r) => ({
      tmdbId: r.tmdb_id,
      mediaType: r.media_type === "tv" ? "tv" : "movie",
      title: r.title,
      posterPath: r.poster_path,
      releaseDate: r.release_date,
      genreIds: r.genre_ids,
      rating: r.rating,
      ratedAt: r.rated_at,
    })),
    watchTime._sum.runtime ?? 0
  );

  return {
    year,
    availableYears: availableBilanYears(
      datedRatings.flatMap((r) => (r.rated_at ? [r.rated_at] : []))
    ),
    stats,
  };
}
