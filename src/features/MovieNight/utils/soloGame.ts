/**
 * Partie solo de « Ce soir ? », jouée entièrement dans le navigateur : pas de session en base,
 * pas de polling. Fonctions pures (testées) + sauvegarde dans le sessionStorage de l'onglet,
 * pour qu'un rechargement reprenne la pile là où on en était.
 */
import { MAX_SOLO_EXCLUDED_IDS } from "@/lib/movie-night/constants";
import type { TDeckMovie, TMovieNightSettings } from "@/lib/movie-night/types";

export type TSoloGame = {
  v: 1;
  settings: TMovieNightSettings;
  deck: TDeckMovie[];
  /** Carte courante ; `deck.length` quand la pile est finie. */
  index: number;
  /** Tous les films proposés depuis le début, exclus d'une « Nouvelle pile ». */
  shownMovieIds: number[];
  /** Film retenu par un « oui » : la partie est finie. */
  chosenMovieId: number | null;
};

export type TSoloStatus = "swiping" | "chosen" | "exhausted";

export const SOLO_STORAGE_KEY = "movie-night-solo";

export function startSoloGame(settings: TMovieNightSettings, deck: TDeckMovie[]): TSoloGame {
  return { v: 1, settings, deck, index: 0, shownMovieIds: deck.map((m) => m.id), chosenMovieId: null };
}

export function soloStatus(game: TSoloGame): TSoloStatus {
  if (game.chosenMovieId !== null) return "chosen";
  return game.index >= game.deck.length ? "exhausted" : "swiping";
}

/** Vote sur la carte courante : un « oui » termine la partie ; sans effet hors "swiping". */
export function swipeSolo(game: TSoloGame, liked: boolean): TSoloGame {
  if (soloStatus(game) !== "swiping") return game;
  return {
    ...game,
    index: game.index + 1,
    chosenMovieId: liked ? game.deck[game.index].id : null,
  };
}

/** « Reprendre la pile » après un « oui » (swipe accidentel) : carte suivante. */
export function resumeSolo(game: TSoloGame): TSoloGame {
  return { ...game, chosenMovieId: null };
}

export function nextSoloDeck(game: TSoloGame, deck: TDeckMovie[]): TSoloGame {
  return {
    ...game,
    deck,
    index: 0,
    chosenMovieId: null,
    shownMovieIds: [...new Set([...game.shownMovieIds, ...deck.map((m) => m.id)])],
  };
}

/** Films à exclure d'une « Nouvelle pile » : les plus récents, dans la limite acceptée par l'API. */
export function soloExcludedIds(game: TSoloGame): number[] {
  return game.shownMovieIds.slice(-MAX_SOLO_EXCLUDED_IDS);
}

const isId = (value: unknown): value is number => Number.isInteger(value) && (value as number) > 0;
const isIdList = (value: unknown): value is number[] => Array.isArray(value) && value.every(isId);
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function isDeckMovie(value: unknown): value is TDeckMovie {
  return (
    isObject(value) &&
    isId(value.id) &&
    typeof value.title === "string" &&
    (value.posterPath === null || typeof value.posterPath === "string") &&
    Array.isArray(value.genreIds) &&
    (value.provider === null || isObject(value.provider))
  );
}

function isSettings(value: unknown): value is TMovieNightSettings {
  return (
    isObject(value) &&
    isIdList(value.providerIds) &&
    value.providerIds.length > 0 &&
    isIdList(value.genreIds) &&
    typeof value.includeSeen === "boolean"
  );
}

/** Partie relue depuis le stockage ; null si absente, illisible ou d'un autre format. */
export function readSoloGame(raw: string | null): TSoloGame | null {
  if (raw === null) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(data) || data.v !== 1 || !isSettings(data.settings)) return null;
  const { deck, index, shownMovieIds, chosenMovieId } = data;
  if (!Array.isArray(deck) || deck.length === 0 || !deck.every(isDeckMovie)) return null;
  if (!Number.isInteger(index) || (index as number) < 0 || (index as number) > deck.length) return null;
  if (!isIdList(shownMovieIds)) return null;
  if (chosenMovieId !== null && !isId(chosenMovieId)) return null;
  return { v: 1, settings: data.settings, deck, index: index as number, shownMovieIds, chosenMovieId };
}

export function loadSoloGame(): TSoloGame | null {
  try {
    return readSoloGame(sessionStorage.getItem(SOLO_STORAGE_KEY));
  } catch {
    return null; // stockage bloqué, ou rendu serveur
  }
}

export function saveSoloGame(game: TSoloGame): void {
  try {
    sessionStorage.setItem(SOLO_STORAGE_KEY, JSON.stringify(game));
  } catch {
    // Stockage indisponible (navigation privée, quota) : la partie continue en mémoire.
  }
}
