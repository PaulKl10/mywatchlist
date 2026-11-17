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
 * Notification du panneau de l'en-tête : une demande en attente de réponse. Elle disparaît
 * dès qu'elle est traitée (acceptée, refusée, rejointe…).
 */
export type TNotificationItem =
  | (TNotificationBase & { type: "movie_night_invite" })
  | (TNotificationBase & { type: "friend_request" })
  | (TNotificationBase & { type: "suggestion"; title: string; mediaType: TMediaType });

export type TNotificationType = TNotificationItem["type"];
