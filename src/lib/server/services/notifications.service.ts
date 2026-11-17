import { prisma } from "@/lib/prisma";
import {
  buildNotificationItems,
  NOTIFICATION_MAX_AGE_MS,
  NOTIFICATIONS_LIMIT,
} from "@/lib/notifications/items";
import type { TNotificationItem } from "@/types/notification.type";
import { listPendingInvites } from "./movieNight.service";
import { USER_DISPLAY_SELECT, userAvatarUrl, userDisplayName, type TUserDisplay } from "./movieNightState";

const toActor = (user: TUserDisplay) => ({ name: userDisplayName(user), avatarUrl: userAvatarUrl(user) });

/** Notifications enregistrées encore affichées (plus récentes que NOTIFICATION_MAX_AGE_MS). */
function storedNotificationsWhere(userId: string, now: Date) {
  return { userId, createdAt: { gte: new Date(now.getTime() - NOTIFICATION_MAX_AGE_MS) } };
}

/**
 * Notifications du panneau, les plus récentes d'abord : demandes en attente (invitations
 * « Ce soir ? », demandes d'ami, suggestions ; mêmes critères que le compteur), réponses
 * des amis à mes suggestions et « J'aime » sur mon activité.
 */
export async function listNotifications(
  userId: string,
  now: Date = new Date()
): Promise<TNotificationItem[]> {
  const [invites, friendRequests, suggestions, stored] = await Promise.all([
    listPendingInvites(userId, now),
    prisma.friendship.findMany({
      where: { receiverId: userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: NOTIFICATIONS_LIMIT,
      select: { id: true, createdAt: true, sender: { select: USER_DISPLAY_SELECT } },
    }),
    prisma.suggestion.findMany({
      where: { toUserId: userId },
      orderBy: { createdAt: "desc" },
      take: NOTIFICATIONS_LIMIT,
      select: {
        id: true,
        title: true,
        media_type: true,
        createdAt: true,
        sender: { select: USER_DISPLAY_SELECT },
      },
    }),
    prisma.userNotification.findMany({
      where: storedNotificationsWhere(userId, now),
      orderBy: { createdAt: "desc" },
      take: NOTIFICATIONS_LIMIT,
      select: {
        id: true,
        type: true,
        tmdb_id: true,
        media_type: true,
        title: true,
        reason: true,
        readAt: true,
        createdAt: true,
        actor: { select: USER_DISPLAY_SELECT },
        activity: { select: { type: true, rating: true } },
      },
    }),
  ]);

  const answers = stored.filter(
    (row) => row.type === "SUGGESTION_ACCEPTED" || row.type === "SUGGESTION_DECLINED"
  );
  // L'événement aimé part avec sa notification (cascade) : `activity` est toujours là.
  const likes = stored.flatMap((row) =>
    row.type === "ACTIVITY_LIKED" && row.activity ? [{ ...row, activity: row.activity }] : []
  );

  return buildNotificationItems({
    invites: invites.map((invite) => ({
      movieNightId: invite.movieNightId,
      createdAt: new Date(invite.createdAt),
      host: { name: invite.hostName, avatarUrl: invite.hostAvatarUrl },
    })),
    friendRequests: friendRequests.map((request) => ({
      id: request.id,
      createdAt: request.createdAt,
      sender: toActor(request.sender),
    })),
    suggestions: suggestions.map((suggestion) => ({
      id: suggestion.id,
      createdAt: suggestion.createdAt,
      sender: toActor(suggestion.sender),
      title: suggestion.title,
      mediaType: suggestion.media_type === "tv" ? "tv" : "movie",
    })),
    answers: answers.map((answer) => ({
      id: answer.id,
      createdAt: answer.createdAt,
      responder: toActor(answer.actor),
      accepted: answer.type === "SUGGESTION_ACCEPTED",
      reason: answer.reason,
      title: answer.title,
      mediaType: answer.media_type === "tv" ? "tv" : "movie",
      tmdbId: answer.tmdb_id,
      read: answer.readAt !== null,
    })),
    likes: likes.map((like) => ({
      id: like.id,
      createdAt: like.createdAt,
      liker: toActor(like.actor),
      activityType: like.activity.type === "RATED" ? "RATED" : "WATCHLIST_ADDED",
      rating: like.activity.rating,
      title: like.title,
      mediaType: like.media_type === "tv" ? "tv" : "movie",
      tmdbId: like.tmdb_id,
      read: like.readAt !== null,
    })),
  });
}

/** Notifications enregistrées pas encore vues (badge). */
export async function countUnreadNotifications(userId: string, now: Date = new Date()): Promise<number> {
  return prisma.userNotification.count({
    where: { ...storedNotificationsWhere(userId, now), readAt: null },
  });
}

/**
 * Marque comme lues les notifications enregistrées jusqu'à `until` inclus (la plus récente
 * affichée) : une réponse arrivée pendant que le panneau était ouvert reste non lue.
 */
export async function markNotificationsRead(
  userId: string,
  until: Date,
  now: Date = new Date()
): Promise<void> {
  await prisma.userNotification.updateMany({
    where: { userId, readAt: null, createdAt: { lte: until } },
    data: { readAt: now },
  });
}
