import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { TActivityItem, TActivityType } from "@/types/activity.type";
import type { TMediaType } from "@/types/movie.type";
import { getFriendIds } from "./friends.service";
import { userAvatarUrl, userDisplayName } from "./movieNightState";

/** Durée de conservation des événements du fil. */
export const ACTIVITY_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
/** Événements renvoyés au plus par le fil. */
const FEED_SIZE = 50;

/** Ligne d'activité à insérer. */
export function activityData(
  userId: string,
  type: TActivityType,
  media: { tmdbId: number; mediaType: TMediaType; title: string; posterPath: string | null },
  rating: number | null = null
): Prisma.ActivityCreateManyInput {
  return {
    userId,
    type,
    tmdb_id: media.tmdbId,
    media_type: media.mediaType,
    title: media.title,
    poster_path: media.posterPath,
    rating,
  };
}

/**
 * Enregistre l'événement d'un titre, ou le remonte en tête du fil s'il existe déjà : un seul
 * événement par utilisateur, type et titre (contrainte unique), même si l'app et la
 * resynchro le signalent en même temps.
 */
export function upsertActivity(data: Prisma.ActivityCreateManyInput) {
  const { userId, type, media_type, tmdb_id, title, poster_path, rating } = data;
  return prisma.activity.upsert({
    where: { userId_type_media_type_tmdb_id: { userId, type, media_type, tmdb_id } },
    create: data,
    update: { title, poster_path, rating, createdAt: new Date() },
  });
}

/** Retire les événements `type` de ces titres. */
export function deleteActivities(
  userId: string,
  type: TActivityType,
  media: { tmdbId: number; mediaType: TMediaType }[]
) {
  return prisma.activity.deleteMany({
    where: {
      userId,
      type,
      OR: media.map(({ tmdbId, mediaType }) => ({ media_type: mediaType, tmdb_id: tmdbId })),
    },
  });
}

/** Fil des amis de `userId` : leurs événements des 30 derniers jours, du plus récent au plus ancien. */
export async function getFriendsActivity(
  userId: string,
  now: Date = new Date()
): Promise<{ items: TActivityItem[]; hasFriends: boolean }> {
  const friendIds = await getFriendIds(userId);
  if (friendIds.length === 0) return { items: [], hasFriends: false };

  const rows = await prisma.activity.findMany({
    where: {
      userId: { in: friendIds },
      createdAt: { gte: new Date(now.getTime() - ACTIVITY_MAX_AGE_MS) },
    },
    orderBy: { createdAt: "desc" },
    take: FEED_SIZE,
    include: {
      user: {
        select: { tmdb_id: true, username: true, gravatar_hash: true, tmdb_avatar_path: true },
      },
    },
  });

  const items: TActivityItem[] = rows.map((row) => ({
    id: row.id,
    type: row.type === "RATED" ? "RATED" : "WATCHLIST_ADDED",
    mediaType: row.media_type === "tv" ? "tv" : "movie",
    tmdbId: row.tmdb_id,
    title: row.title,
    posterPath: row.poster_path,
    rating: row.rating,
    createdAt: row.createdAt.toISOString(),
    user: {
      tmdbId: row.user.tmdb_id,
      name: userDisplayName(row.user),
      avatarUrl: userAvatarUrl(row.user),
    },
  }));
  return { items, hasFriends: true };
}
