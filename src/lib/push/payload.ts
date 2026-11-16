import type { TPushEvent, TPushPayload } from "./types";

/** Construit le contenu (titre, texte, lien, tag de regroupement) d'une notification push. */
/** Titre borné à 100 caractères pour que la notification reste lisible. */
const MAX_TITLE_LENGTH = 100;

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
    case "suggestion": {
      const title =
        event.title.length > MAX_TITLE_LENGTH
          ? event.title.slice(0, MAX_TITLE_LENGTH - 1) + "…"
          : event.title;
      return {
        title: `${event.fromName} vous propose « ${title} »`,
        body: `${event.mediaType === "tv" ? "Une série" : "Un film"} à découvrir sur votre profil.`,
        url: "/profile",
        tag: `suggestion-${event.fromUserId}-${event.mediaType}-${event.tmdbId}`,
      };
    }
  }
}
