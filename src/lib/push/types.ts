/** Contenu d'une notification push, tel que lu par le service worker. */
export type TPushPayload = { title: string; body: string; url: string; tag: string };

/** Événement métier qui déclenche une notification push. */
export type TPushEvent =
  | { type: "movie_night_invite"; fromName: string; movieNightId: string }
  | { type: "friend_request"; fromName: string; fromUserId: string }
  | {
      type: "suggestion";
      fromName: string;
      fromUserId: string;
      title: string;
      mediaType: "movie" | "tv";
      tmdbId: number;
    }
  | {
      type: "suggestion_answered";
      fromName: string;
      fromUserId: string;
      title: string;
      mediaType: "movie" | "tv";
      tmdbId: number;
      accepted: boolean;
      /** Libellé du motif d'un refus. */
      reasonLabel: string | null;
    }
  | {
      type: "now_available";
      title: string;
      mediaType: "movie" | "tv";
      tmdbId: number;
      providerName: string;
    }
  | { type: "now_available_many"; count: number; providerNames: string[] };

/** Abonnement push normalisé (issu de `PushSubscription.toJSON()`). */
export type TPushSubscriptionInput = { endpoint: string; p256dh: string; auth: string };
