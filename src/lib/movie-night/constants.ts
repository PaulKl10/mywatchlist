/** Constantes partagées de « Ce soir ? » (client et serveur). */
export const MAX_PARTICIPANTS = 4;
/** Films par pile, solo comme à plusieurs. */
export const DECK_SIZE = 15;
export const INACTIVE_AFTER_MS = 60_000;
export const SESSION_TTL_MS = 6 * 60 * 60 * 1000;
export const POLL_INTERVAL_MS = 2_000;
export const CODE_LENGTH = 6;
export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // sans 0/O, 1/I/L
export const GUEST_NAME_MAX_LENGTH = 20;
export const GUEST_COOKIE = "movie_night_guest";
export const WATCH_REGION = "FR";
export const MIN_VOTE_COUNT = 100;
export const DISCOVER_MAX_PAGE = 10;
/** Fiches TMDB lues en plus de `DECK_SIZE`, pour remplacer les films sans abonnement choisi. */
export const DECK_EXTRA_DETAILS = 5;
export const PODIUM_SIZE = 3;
export const MAX_PROVIDER_IDS = 50;
/** Films déjà proposés envoyés au plus pour une « Nouvelle pile » solo (les plus récents). */
export const MAX_SOLO_EXCLUDED_IDS = 300;
