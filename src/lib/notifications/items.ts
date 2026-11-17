import { PROFILE_ANCHORS } from "@/lib/constants";
import type { TReaction } from "@/lib/activity/reactions";
import type { TActivityType } from "@/types/activity.type";
import type { TMediaType } from "@/types/movie.type";
import type { TNotificationActor, TNotificationItem } from "@/types/notification.type";

/** Nombre maximal de notifications renvoyées au panneau. */
export const NOTIFICATIONS_LIMIT = 50;

/** Durée de conservation des notifications enregistrées (réponses aux suggestions, réactions). */
export const NOTIFICATION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Pages où chaque demande se traite. */
export const NOTIFICATION_HREFS = {
  movie_night_invite: "/ce-soir",
  friend_request: `/profile#${PROFILE_ANCHORS.friendRequests}`,
  suggestion: `/profile#${PROFILE_ANCHORS.suggestions}`,
} as const satisfies Record<
  Exclude<TNotificationItem["type"], "suggestion_answered" | "activity_reaction">,
  string
>;

/** Notification enregistrée pas encore vue (les demandes en attente ne le sont jamais). */
export function isUnreadNotification(item: TNotificationItem): boolean {
  return (item.type === "suggestion_answered" || item.type === "activity_reaction") && item.unread;
}

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
  /** Réactions des amis à mon activité. */
  reactions: {
    id: string;
    createdAt: Date;
    reactor: TNotificationActor;
    reaction: TReaction;
    activityType: TActivityType;
    rating: number | null;
    title: string;
    mediaType: TMediaType;
    tmdbId: number;
    read: boolean;
  }[];
};

/** Demandes en attente → notifications, de la plus récente à la plus ancienne. */
export function buildNotificationItems(
  { invites, friendRequests, suggestions, answers, reactions }: TNotificationSources,
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
    ...reactions.map((reaction) => ({
      at: reaction.createdAt.getTime(),
      item: {
        type: "activity_reaction" as const,
        id: `activity_reaction:${reaction.id}`,
        actor: reaction.reactor,
        createdAt: reaction.createdAt.toISOString(),
        href: mediaHref(reaction.mediaType, reaction.tmdbId),
        reaction: reaction.reaction,
        title: reaction.title,
        mediaType: reaction.mediaType,
        activityType: reaction.activityType,
        rating: reaction.activityType === "RATED" ? reaction.rating : null,
        unread: !reaction.read,
      },
    })),
  ];

  return dated
    .sort((a, b) => b.at - a.at)
    .slice(0, limit)
    .map(({ item }) => item);
}
