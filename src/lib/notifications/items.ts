import { PROFILE_ANCHORS } from "@/lib/constants";
import type { TMediaType } from "@/types/movie.type";
import type { TNotificationActor, TNotificationItem } from "@/types/notification.type";

/** Nombre maximal de notifications renvoyées au panneau. */
export const NOTIFICATIONS_LIMIT = 50;

/** Pages où chaque demande se traite. */
export const NOTIFICATION_HREFS = {
  movie_night_invite: "/ce-soir",
  friend_request: `/profile#${PROFILE_ANCHORS.friendRequests}`,
  suggestion: `/profile#${PROFILE_ANCHORS.suggestions}`,
} as const satisfies Record<TNotificationItem["type"], string>;

export type TNotificationSources = {
  invites: { movieNightId: string; createdAt: Date; host: TNotificationActor }[];
  friendRequests: { id: string; createdAt: Date; sender: TNotificationActor }[];
  suggestions: {
    id: string;
    createdAt: Date;
    sender: TNotificationActor;
    title: string;
    mediaType: TMediaType;
  }[];
};

/** Demandes en attente → notifications, de la plus récente à la plus ancienne. */
export function buildNotificationItems(
  { invites, friendRequests, suggestions }: TNotificationSources,
  limit: number = NOTIFICATIONS_LIMIT
): TNotificationItem[] {
  const dated: { at: number; item: TNotificationItem }[] = [
    ...invites.map((invite) => ({
      at: invite.createdAt.getTime(),
      item: {
        type: "movie_night_invite" as const,
        id: `movie_night_invite:${invite.movieNightId}`,
        actor: invite.host,
        createdAt: invite.createdAt.toISOString(),
        href: NOTIFICATION_HREFS.movie_night_invite,
      },
    })),
    ...friendRequests.map((request) => ({
      at: request.createdAt.getTime(),
      item: {
        type: "friend_request" as const,
        id: `friend_request:${request.id}`,
        actor: request.sender,
        createdAt: request.createdAt.toISOString(),
        href: NOTIFICATION_HREFS.friend_request,
      },
    })),
    ...suggestions.map((suggestion) => ({
      at: suggestion.createdAt.getTime(),
      item: {
        type: "suggestion" as const,
        id: `suggestion:${suggestion.id}`,
        actor: suggestion.sender,
        createdAt: suggestion.createdAt.toISOString(),
        href: NOTIFICATION_HREFS.suggestion,
        title: suggestion.title,
        mediaType: suggestion.mediaType,
      },
    })),
  ];

  return dated
    .sort((a, b) => b.at - a.at)
    .slice(0, limit)
    .map(({ item }) => item);
}
