import type { TPushEvent, TPushPayload } from "./types";

/** Construit le contenu (titre, texte, lien, tag de regroupement) d'une notification push. */
export function buildPushPayload(event: TPushEvent): TPushPayload {
  switch (event.type) {
    case "movie_night_invite":
      return {
        title: `${event.fromName} vous invite à « Ce soir ? »`,
        body: "Rejoignez la partie pour choisir un film ensemble.",
        url: "/ce-soir",
        tag: `movie-night-${event.movieNightId}`,
      };
    case "friend_request":
      return {
        title: `${event.fromName} vous a demandé en ami`,
        body: "Répondez depuis votre profil.",
        url: "/profile",
        tag: `friend-request-${event.fromUserId}`,
      };
    case "suggestion":
      return {
        title: `${event.fromName} vous propose « ${event.title} »`,
        body: `${event.mediaType === "tv" ? "Une série" : "Un film"} à découvrir sur votre profil.`,
        url: "/profile",
        tag: `suggestion-${event.fromUserId}-${event.mediaType}-${event.tmdbId}`,
      };
  }
}
