import { PROFILE_ANCHORS } from "@/lib/constants";
import type { TMediaType } from "@/types/movie.type";
import type { TNotificationActor, TNotificationItem } from "@/types/notification.type";

/** Nombre maximal de notifications renvoyées au panneau. */
export const NOTIFICATIONS_LIMIT = 50;

/** Durée de conservation des notifications enregistrées (réponses aux suggestions). */
export const NOTIFICATION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Pages où chaque demande se traite. */
export const NOTIFICATION_HREFS = {
  movie_night_invite: "/ce-soir",
  friend_request: `/profile#${PROFILE_ANCHORS.friendRequests}`,
  suggestion: `/profile#${PROFILE_ANCHORS.suggestions}`,
} as const satisfies Record<Exclude<TNotificationItem["type"], "suggestion_answered">, string>;

const mediaHref = (mediaType: TMediaType, tmdbId: number) =>
  mediaType === "tv" ? `/tv/${tmdbId}` : `/movies/${tmdbId}`;

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
  /** Réponses des amis à mes suggestions. */
  answers: {
    id: string;
    createdAt: Date;
    responder: TNotificationActor;
    accepted: boolean;
    reason: string | null;
    title: string;
    mediaType: TMediaType;
    tmdbId: number;
    read: boolean;
  }[];
};

/** Demandes en attente → notifications, de la plus récente à la plus ancienne. */
export function buildNotificationItems(
  { invites, friendRequests, suggestions, answers }: TNotificationSources,
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
    ...answers.map((answer) => ({
      at: answer.createdAt.getTime(),
      item: {
        type: "suggestion_answered" as const,
        id: `suggestion_answered:${answer.id}`,
        actor: answer.responder,
        createdAt: answer.createdAt.toISOString(),
        href: mediaHref(answer.mediaType, answer.tmdbId),
        title: answer.title,
        mediaType: answer.mediaType,
        accepted: answer.accepted,
        reason: answer.accepted ? null : answer.reason,
        unread: !answer.read,
      },
    })),
  ];

  return dated
    .sort((a, b) => b.at - a.at)
    .slice(0, limit)
    .map(({ item }) => item);
}
