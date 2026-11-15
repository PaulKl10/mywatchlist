import { TMDB_MOVIE_GENRES } from "@/features/DiscoverMovies/constants/genres";
import { DECK_SIZES, GUEST_NAME_MAX_LENGTH, MAX_PROVIDER_IDS, type TDeckSize } from "./constants";
import type { TMovieNightSettings } from "./types";

export type TCreateMovieNightInput = TMovieNightSettings & { solo: boolean };

type TParseResult = { ok: true; value: TCreateMovieNightInput } | { ok: false; message: string };

const INVALID = (message: string): TParseResult => ({ ok: false, message });
const GENRE_IDS: ReadonlySet<number> = new Set(TMDB_MOVIE_GENRES.map((g) => g.id));

export function parseCreateMovieNightInput(body: unknown): TParseResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return INVALID("Requête invalide.");
  const { providerIds, genreIds, deckSize, includeSeen, solo } = body as Record<string, unknown>;

  if (!Array.isArray(providerIds) || providerIds.length === 0) return INVALID("Choisissez au moins une plateforme.");
  if (!providerIds.every((id) => Number.isInteger(id) && id > 0)) return INVALID("Requête invalide.");
  const providers = [...new Set(providerIds as number[])];
  if (providers.length > MAX_PROVIDER_IDS) return INVALID("Requête invalide.");

  if (!Array.isArray(genreIds)) return INVALID("Requête invalide.");
  if (!genreIds.every((id) => typeof id === "number" && GENRE_IDS.has(id))) return INVALID("Genre inconnu.");
  const genres = [...new Set(genreIds as number[])];

  if (!(DECK_SIZES as readonly unknown[]).includes(deckSize)) return INVALID("Taille de pile invalide.");
  if (includeSeen !== undefined && typeof includeSeen !== "boolean") return INVALID("Requête invalide.");
  if (solo !== undefined && typeof solo !== "boolean") return INVALID("Requête invalide.");

  return {
    ok: true,
    value: {
      providerIds: providers,
      genreIds: genres,
      deckSize: deckSize as TDeckSize,
      includeSeen: includeSeen ?? false,
      solo: solo ?? false,
    },
  };
}

export function parseGuestName(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const name = input.trim();
  const length = [...name].length;
  if (length < 1 || length > GUEST_NAME_MAX_LENGTH) return null;
  if (/[\u0000-\u001f\u007f-\u009f]/.test(name)) return null;
  return name;
}
