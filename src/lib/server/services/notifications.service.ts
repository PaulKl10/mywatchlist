import { prisma } from "@/lib/prisma";
import { buildNotificationItems, NOTIFICATIONS_LIMIT } from "@/lib/notifications/items";
import type { TNotificationItem } from "@/types/notification.type";
import { listPendingInvites } from "./movieNight.service";
import { USER_DISPLAY_SELECT, userAvatarUrl, userDisplayName, type TUserDisplay } from "./movieNightState";

const toActor = (user: TUserDisplay) => ({ name: userDisplayName(user), avatarUrl: userAvatarUrl(user) });

/**
 * Demandes en attente de l'utilisateur (invitations « Ce soir ? », demandes d'ami, suggestions),
 * les plus récentes d'abord. Mêmes critères que le compteur `/api/notifications/count`.
 */
export async function listNotifications(userId: string): Promise<TNotificationItem[]> {
  const [invites, friendRequests, suggestions] = await Promise.all([
    listPendingInvites(userId),
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
  ]);

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
  });
}
