/** Constantes partagées de « Ce soir ? » (client et serveur). */
export const MAX_PARTICIPANTS = 4;
export const DECK_SIZES = [10, 15, 20] as const;
export type TDeckSize = (typeof DECK_SIZES)[number];
export const DEFAULT_DECK_SIZE: TDeckSize = 15;
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
/** Fiches TMDB lues en plus de `deckSize`, pour remplacer les films sans abonnement choisi. */
export const DECK_EXTRA_DETAILS = 5;
export const PODIUM_SIZE = 3;
export const MAX_PROVIDER_IDS = 50;
