import { prisma } from "@/lib/prisma";

export type TWatchTimeStats = {
  totalMinutes: number;
  totalHours: number;
  movieCount: number;
  tvCount: number;
};

/** Temps de visionnage cumulé d'un utilisateur, avec le nombre de films et de séries notés. */
export async function getWatchTimeStats(userId: string): Promise<TWatchTimeStats> {
  const [aggregate, countsByMediaType] = await Promise.all([
    prisma.watchTimeEntry.aggregate({
      where: { userId },
      _sum: { runtime: true },
    }),
    prisma.watchTimeEntry.groupBy({
      by: ["media_type"],
      where: { userId },
      _count: { _all: true },
    }),
  ]);

  const countFor = (mediaType: "movie" | "tv") =>
    countsByMediaType.find((row) => row.media_type === mediaType)?._count._all ?? 0;

  const totalMinutes = aggregate._sum.runtime ?? 0;

  return {
    totalMinutes,
    totalHours: Math.floor(totalMinutes / 60),
    movieCount: countFor("movie"),
    tvCount: countFor("tv"),
  };
}
