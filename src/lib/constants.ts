/** Base URL pour les images TMDB. Ex: `${TMDB_IMAGE_BASE}/w500${path}` */
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

/** `sizes` des posters affichés en grille (2 à 5 colonnes selon l'écran). */
export const POSTER_GRID_SIZES =
  "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw";

/** Cookie httpOnly contenant le session_id TMDB. */
export const SESSION_COOKIE = "tmdb_session_id";

/** Cookie temporaire du request token TMDB, le temps de la connexion. */
export const REQUEST_TOKEN_COOKIE = "tmdb_request_token";
