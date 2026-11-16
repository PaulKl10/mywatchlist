import { prisma } from "@/lib/prisma";
import type { TMediaType } from "@/types/movie.type";

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

  const countFor = (mediaType: TMediaType) =>
    countsByMediaType.find((row) => row.media_type === mediaType)?._count._all ?? 0;

  const totalMinutes = aggregate._sum.runtime ?? 0;

  return {
    totalMinutes,
    totalHours: Math.floor(totalMinutes / 60),
    movieCount: countFor("movie"),
    tvCount: countFor("tv"),
  };
}

/** Compte (ou met à jour) un média noté dans le temps de visionnage. */
export async function recordWatchTime(
  userId: string,
  mediaType: TMediaType,
  mediaId: number,
  runtime: number | null
): Promise<void> {
  await prisma.watchTimeEntry.upsert({
    where: {
      userId_media_type_tmdb_movie_id: {
        userId,
        media_type: mediaType,
        tmdb_movie_id: mediaId,
      },
    },
    create: {
      userId,
      tmdb_movie_id: mediaId,
      media_type: mediaType,
      runtime,
      created_at: new Date(),
    },
    update: { runtime },
  });
}

/** Retire un média du temps de visionnage (note supprimée). */
export async function removeWatchTime(
  userId: string,
  mediaType: TMediaType,
  mediaId: number
): Promise<void> {
  await prisma.watchTimeEntry.deleteMany({
    where: { userId, media_type: mediaType, tmdb_movie_id: mediaId },
  });
}
