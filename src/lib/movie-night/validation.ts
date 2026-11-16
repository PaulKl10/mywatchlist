import { TMDB_MOVIE_GENRES } from "@/features/DiscoverMovies/constants/genres";
import { GUEST_NAME_MAX_LENGTH, MAX_PROVIDER_IDS, MAX_SOLO_EXCLUDED_IDS } from "./constants";
import type { TMovieNightDecision, TMovieNightSettings } from "./types";

/** Réglages de création ; `deckSize` et `solo` d'un ancien client sont ignorés. */
export type TCreateMovieNightInput = TMovieNightSettings;
export type TSoloDeckInput = TMovieNightSettings & { excludedMovieIds: number[] };

type TParsed<T> = { ok: true; value: T } | { ok: false; message: string };

const INVALID = (message: string): { ok: false; message: string } => ({ ok: false, message });
const GENRE_IDS: ReadonlySet<number> = new Set(TMDB_MOVIE_GENRES.map((g) => g.id));

/**
 * Plus grand id accepté : `tmdb_movie_id` et `provider_ids` sont des entiers Postgres 32 bits.
 * Au-delà, l'écriture échouerait (500) au lieu d'un 400.
 */
const MAX_MOVIE_ID = 2_147_483_647;

/** Id TMDB (film ou plateforme) stockable dans une colonne `Int`. */
function isMovieId(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0 && (value as number) <= MAX_MOVIE_ID;
}

function asObject(body: unknown): Record<string, unknown> | null {
  return typeof body === "object" && body !== null && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : null;
}

/** Ids de plateformes valides et dédoublonnés (liste vide acceptée), ou null. */
export function parseProviderIds(value: unknown): number[] | null {
  if (!Array.isArray(value) || !value.every(isMovieId)) return null;
  const ids = [...new Set(value as number[])];
  return ids.length > MAX_PROVIDER_IDS ? null : ids;
}

function parseSettings(input: Record<string, unknown>): TParsed<TMovieNightSettings> {
  const { providerIds, genreIds, includeSeen, fromWatchlists } = input;

  if (!Array.isArray(providerIds) || providerIds.length === 0) return INVALID("Choisissez au moins une plateforme.");
  const providers = parseProviderIds(providerIds);
  if (!providers) return INVALID("Requête invalide.");

  if (!Array.isArray(genreIds)) return INVALID("Requête invalide.");
  if (!genreIds.every((id) => typeof id === "number" && GENRE_IDS.has(id))) return INVALID("Genre inconnu.");
  const genres = [...new Set(genreIds as number[])];

  if (includeSeen !== undefined && typeof includeSeen !== "boolean") return INVALID("Requête invalide.");
  if (fromWatchlists !== undefined && typeof fromWatchlists !== "boolean") return INVALID("Requête invalide.");

  return {
    ok: true,
    value: {
      providerIds: providers,
      genreIds: genres,
      includeSeen: includeSeen ?? false,
      fromWatchlists: fromWatchlists ?? false,
    },
  };
}

/** Corps de `POST /api/movie-night` : `{ providerIds, genreIds, includeSeen?, fromWatchlists? }`. */
export function parseCreateMovieNightInput(body: unknown): TParsed<TCreateMovieNightInput> {
  const input = asObject(body);
  return input ? parseSettings(input) : INVALID("Requête invalide.");
}

/** Corps de `POST /api/movie-night/solo` : réglages + `excludedMovieIds?` (films déjà proposés). */
export function parseSoloDeckInput(body: unknown): TParsed<TSoloDeckInput> {
  const input = asObject(body);
  if (!input) return INVALID("Requête invalide.");
  const settings = parseSettings(input);
  if (!settings.ok) return settings;

  const excluded = input.excludedMovieIds ?? [];
  if (!Array.isArray(excluded) || excluded.length > MAX_SOLO_EXCLUDED_IDS || !excluded.every(isMovieId)) {
    return INVALID("Requête invalide.");
  }
  return { ok: true, value: { ...settings.value, excludedMovieIds: [...new Set(excluded as number[])] } };
}

export function parseGuestName(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const name = input.trim();
  const length = [...name].length;
  if (length < 1 || length > GUEST_NAME_MAX_LENGTH) return null;
  if (/[\u0000-\u001f\u007f-\u009f]/.test(name)) return null;
  return name;
}

/** Corps de `POST /votes` : `{ movieId, liked }`. */
export function parseVoteInput(body: unknown): { movieId: number; liked: boolean } | null {
  const input = asObject(body);
  if (!input || !isMovieId(input.movieId) || typeof input.liked !== "boolean") return null;
  return { movieId: input.movieId, liked: input.liked };
}

/** Corps de `POST /decision` : `{ action: "watch", movieId }` ou `{ action: "continue", movieId? }`. */
export function parseMovieNightDecision(body: unknown): TMovieNightDecision | null {
  const input = asObject(body);
  if (input?.action === "continue") {
    if (input.movieId === undefined) return { action: "continue" };
    return isMovieId(input.movieId) ? { action: "continue", movieId: input.movieId } : null;
  }
  if (input?.action === "watch" && isMovieId(input.movieId)) {
    return { action: "watch", movieId: input.movieId };
  }
  return null;
}
