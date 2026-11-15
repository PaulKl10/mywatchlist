import { afterEach, describe, expect, it, vi } from "vitest";
import type { TDeckMovie, TMovieNightSettings } from "@/lib/movie-night/types";
import {
  SOLO_STORAGE_KEY,
  nextSoloDeck,
  readSoloGame,
  resumeSolo,
  soloExcludedIds,
  soloStatus,
  startSoloGame,
  swipeSolo,
} from "./soloGame";

const movie = (id: number): TDeckMovie => ({
  id,
  title: `Film ${id}`,
  posterPath: null,
  releaseDate: null,
  voteAverage: 7,
  runtime: 100,
  genreIds: [35],
  overview: "",
  provider: { id: 8, name: "Netflix", logoPath: null },
});
const settings: TMovieNightSettings = { providerIds: [8], genreIds: [35], includeSeen: false };
const [a, b, c, d] = [movie(1), movie(2), movie(3), movie(4)];
const start = () => startSoloGame(settings, [a, b, c]);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("partie solo", () => {
  it("démarre sur la première carte, films proposés = la pile", () => {
    const game = start();
    expect(game).toMatchObject({ index: 0, chosenMovieId: null, shownMovieIds: [1, 2, 3] });
    expect(soloStatus(game)).toBe("swiping");
  });

  it("non : carte suivante", () => {
    const game = swipeSolo(start(), false);
    expect(game.index).toBe(1);
    expect(soloStatus(game)).toBe("swiping");
  });

  it("oui : la partie est finie sur ce film", () => {
    const game = swipeSolo(start(), true);
    expect(game).toMatchObject({ index: 1, chosenMovieId: 1 });
    expect(soloStatus(game)).toBe("chosen");
  });

  it("un swipe sur une partie finie ne retient pas un second film", () => {
    const chosen = swipeSolo(start(), true);
    expect(swipeSolo(chosen, true)).toBe(chosen);
    const exhausted = swipeSolo(swipeSolo(swipeSolo(start(), false), false), false);
    expect(swipeSolo(exhausted, true)).toBe(exhausted);
  });

  it("ne modifie pas la partie reçue", () => {
    const game = start();
    swipeSolo(game, true);
    expect(game).toMatchObject({ index: 0, chosenMovieId: null });
  });

  it("reprendre la pile : carte suivante, ou pile finie après la dernière", () => {
    const resumed = resumeSolo(swipeSolo(start(), true));
    expect(soloStatus(resumed)).toBe("swiping");
    expect(resumed.deck[resumed.index]).toEqual(b);

    const onLast = swipeSolo(swipeSolo(swipeSolo(start(), false), false), true);
    expect(soloStatus(onLast)).toBe("chosen");
    expect(soloStatus(resumeSolo(onLast))).toBe("exhausted");
  });

  it("trois non : pile finie, puis nouvelle pile", () => {
    const exhausted = swipeSolo(swipeSolo(swipeSolo(start(), false), false), false);
    expect(soloStatus(exhausted)).toBe("exhausted");
    const next = nextSoloDeck(exhausted, [d, a]);
    expect(next).toMatchObject({ index: 0, chosenMovieId: null, deck: [d, a], shownMovieIds: [1, 2, 3, 4] });
    expect(soloStatus(next)).toBe("swiping");
  });

  it("exclusions envoyées : les 300 films proposés les plus récents", () => {
    const deck = Array.from({ length: 310 }, (_, i) => movie(i + 1));
    const excluded = soloExcludedIds(startSoloGame(settings, deck));
    expect(excluded).toHaveLength(300);
    expect(excluded[0]).toBe(11);
    expect(excluded.at(-1)).toBe(310);
  });
});

describe("readSoloGame", () => {
  it("aller-retour JSON", () => {
    const game = swipeSolo(start(), false);
    expect(readSoloGame(JSON.stringify(game))).toEqual(game);
  });

  it.each([
    ["absent", null],
    ["JSON invalide", "{"],
    ["autre version", JSON.stringify({ ...start(), v: 2 })],
    ["index négatif", JSON.stringify({ ...start(), index: -1 })],
    ["index non entier", JSON.stringify({ ...start(), index: 1.5 })],
    ["index au-delà de la pile", JSON.stringify({ ...start(), index: 4 })],
    ["pile non tableau", JSON.stringify({ ...start(), deck: "x" })],
    ["pile vide", JSON.stringify({ ...start(), deck: [] })],
    ["film incomplet", JSON.stringify({ ...start(), deck: [{ id: 1 }] })],
    ["réglages absents", JSON.stringify({ ...start(), settings: null })],
    ["film retenu invalide", JSON.stringify({ ...start(), chosenMovieId: "1" })],
  ])("%s → null", (_label, raw) => {
    expect(readSoloGame(raw)).toBeNull();
  });
});

describe("sauvegarde dans l'onglet", () => {
  // Module rechargé à chaque test : la copie en mémoire ne fuit pas d'un test à l'autre.
  const freshModule = async () => {
    vi.resetModules();
    return import("./soloGame");
  };

  it("enregistre puis relit la partie", async () => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    });
    const solo = await freshModule();
    const game = solo.startSoloGame(settings, [a, b, c]);
    solo.saveSoloGame(game);
    expect(store.has(solo.SOLO_STORAGE_KEY)).toBe(true);
    expect(solo.loadSoloGame()).toEqual(game);
  });

  it("rechargement de l'onglet : relit la partie enregistrée", async () => {
    const game = swipeSolo(start(), false);
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => (key === SOLO_STORAGE_KEY ? JSON.stringify(game) : null),
      setItem: () => {},
    });
    const solo = await freshModule();
    expect(solo.loadSoloGame()).toEqual(game);
  });

  it("stockage indisponible : aucune exception, la partie suit la navigation en mémoire", async () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    });
    const solo = await freshModule();
    expect(solo.loadSoloGame()).toBeNull();
    const game = solo.startSoloGame(settings, [a, b, c]);
    expect(() => solo.saveSoloGame(game)).not.toThrow();
    expect(solo.loadSoloGame()).toEqual(game);
  });

  it("pas de sessionStorage (rendu serveur) : aucune partie", async () => {
    const solo = await freshModule();
    expect(solo.loadSoloGame()).toBeNull();
  });
});
