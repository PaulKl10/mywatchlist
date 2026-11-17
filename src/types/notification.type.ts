import type { TReaction } from "@/lib/activity/reactions";
import type { TActivityType } from "./activity.type";
import type { TMediaType } from "./movie.type";

/** Ami à l'origine d'une notification. */
export type TNotificationActor = { name: string; avatarUrl: string | null };

type TNotificationBase = {
  /** Unique dans la liste : `${type}:${id de la source}`. */
  id: string;
  actor: TNotificationActor;
  /** ISO 8601. */
  createdAt: string;
  /** Page interne où traiter la notification. */
  href: string;
};

/**
 * Notification du panneau de l'en-tête. Les demandes en attente (invitation, demande d'ami,
 * suggestion) disparaissent dès qu'elles sont traitées ; les réponses à mes suggestions et
 * les réactions à mon activité restent 30 jours, signalées tant qu'elles ne sont pas lues.
 */
export type TNotificationItem =
  | (TNotificationBase & { type: "movie_night_invite" })
  | (TNotificationBase & { type: "friend_request" })
  | (TNotificationBase & { type: "suggestion"; title: string; mediaType: TMediaType })
  | (TNotificationBase & {
      type: "suggestion_answered";
      title: string;
      mediaType: TMediaType;
      accepted: boolean;
      /** Code du motif d'un refus (voir `src/lib/suggestions/declineReasons.ts`). */
      reason: string | null;
      unread: boolean;
    })
  | (TNotificationBase & {
      type: "activity_reaction";
      reaction: TReaction;
      title: string;
      mediaType: TMediaType;
      /** Événement concerné : note (avec sa valeur) ou ajout à la watchlist. */
      activityType: TActivityType;
      rating: number | null;
      unread: boolean;
    });

export type TNotificationType = TNotificationItem["type"];
