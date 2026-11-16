import { describe, expect, it } from "vitest";
import {
  parseCreateMovieNightInput,
  parseGuestName,
  parseMovieNightDecision,
  parseSoloDeckInput,
  parseVoteInput,
  parseProviderIds,
} from "./validation";

describe("parseCreateMovieNightInput", () => {
  it("normalise une entrée valide", () => {
    expect(parseCreateMovieNightInput({ providerIds: [8, 8, 337], genreIds: [35] })).toEqual({
      ok: true,
      value: { providerIds: [8, 337], genreIds: [35], includeSeen: false, fromWatchlists: false },
    });
  });
  it("ignore deckSize et solo d'un ancien client", () => {
    expect(
      parseCreateMovieNightInput({ providerIds: [8, 8, 337], genreIds: [35], deckSize: 10, solo: true }),
    ).toEqual({
      ok: true,
      value: { providerIds: [8, 337], genreIds: [35], includeSeen: false, fromWatchlists: false },
    });
  });
  it("garde l'option « Piocher dans nos watchlists »", () => {
    expect(parseCreateMovieNightInput({ providerIds: [8], genreIds: [], fromWatchlists: true })).toEqual({
      ok: true,
      value: { providerIds: [8], genreIds: [], includeSeen: false, fromWatchlists: true },
    });
  });
  it("accepte un id de plateforme jusqu'à 2³¹−1 (colonne Int)", () => {
    expect(parseCreateMovieNightInput({ providerIds: [2_147_483_647], genreIds: [] }).ok).toBe(true);
  });
  it.each([
    [{ providerIds: [], genreIds: [] }],
    [{ providerIds: [8], genreIds: [999] }],
    [{ providerIds: "8", genreIds: [] }],
    [{ providerIds: [8.5], genreIds: [] }],
    [{ providerIds: [2_147_483_648], genreIds: [] }],
    [{ providerIds: Array.from({ length: 51 }, (_, i) => i + 1), genreIds: [] }],
    [{ providerIds: [8], genreIds: [], includeSeen: "oui" }],
    [{ providerIds: [8], genreIds: [], fromWatchlists: 1 }],
    [null],
  ])("refuse %j", (body) => {
    expect(parseCreateMovieNightInput(body).ok).toBe(false);
  });
});

describe("parseSoloDeckInput", () => {
  it("réglages + exclusions dédoublonnées", () => {
    expect(
      parseSoloDeckInput({ providerIds: [8], genreIds: [], includeSeen: true, excludedMovieIds: [5, 5, 7] }),
    ).toEqual({
      ok: true,
      value: { providerIds: [8], genreIds: [], includeSeen: true, fromWatchlists: false, excludedMovieIds: [5, 7] },
    });
  });
  it("sans exclusions : liste vide", () => {
    expect(parseSoloDeckInput({ providerIds: [8], genreIds: [] })).toEqual({
      ok: true,
      value: { providerIds: [8], genreIds: [], includeSeen: false, fromWatchlists: false, excludedMovieIds: [] },
    });
  });
  it.each([
    [{ excludedMovieIds: "5" }],
    [{ excludedMovieIds: [0] }],
    [{ excludedMovieIds: [2_147_483_648] }],
    [{ excludedMovieIds: Array.from({ length: 301 }, (_, i) => i + 1) }],
    [{ providerIds: [] }],
  ])("refuse %j", (extra) => {
    expect(parseSoloDeckInput({ providerIds: [8], genreIds: [], ...extra }).ok).toBe(false);
  });
});

describe("parseGuestName", () => {
  it("trim et accepte jusqu'à 20 caractères", () => {
    expect(parseGuestName("  Léa  ")).toBe("Léa");
    expect(parseGuestName("a".repeat(20))).toBe("a".repeat(20));
    expect(parseGuestName("🎬".repeat(20))).toBe("🎬".repeat(20));
  });
  it("refuse vide, trop long, non-chaîne, caractère de contrôle", () => {
    expect(parseGuestName("   ")).toBeNull();
    expect(parseGuestName("a".repeat(21))).toBeNull();
    expect(parseGuestName(42)).toBeNull();
    expect(parseGuestName("a\u0000b")).toBeNull();
  });
});

describe("parseVoteInput", () => {
  it("accepte { movieId, liked } et ignore le reste", () => {
    expect(parseVoteInput({ movieId: 550, liked: true, extra: 1 })).toEqual({ movieId: 550, liked: true });
    expect(parseVoteInput({ movieId: 550, liked: false })).toEqual({ movieId: 550, liked: false });
  });
  it.each([
    [{ movieId: "550", liked: true }],
    [{ movieId: 0, liked: true }],
    [{ movieId: -3, liked: true }],
    [{ movieId: 1.5, liked: true }],
    [{ movieId: 2_147_483_648, liked: true }],
    [{ movieId: 550, liked: "true" }],
    [{ movieId: 550 }],
    [[550, true]],
    [null],
    [undefined],
  ])("refuse %j", (body) => {
    expect(parseVoteInput(body)).toBeNull();
  });
});

describe("parseMovieNightDecision", () => {
  it("accepte watch avec un film, et continue avec ou sans film", () => {
    expect(parseMovieNightDecision({ action: "watch", movieId: 550 })).toEqual({ action: "watch", movieId: 550 });
    expect(parseMovieNightDecision({ action: "continue" })).toEqual({ action: "continue" });
    expect(parseMovieNightDecision({ action: "continue", movieId: 550 })).toEqual({
      action: "continue",
      movieId: 550,
    });
  });
  it.each([
    [{ action: "watch" }],
    [{ action: "watch", movieId: "550" }],
    [{ action: "watch", movieId: 0 }],
    [{ action: "continue", movieId: "550" }],
    [{ action: "continue", movieId: 0 }],
    [{ action: "continue", movieId: null }],
    [{ action: "stop" }],
    [{}],
    [null],
  ])("refuse %j", (body) => {
    expect(parseMovieNightDecision(body)).toBeNull();
  });
});

describe("parseProviderIds", () => {
  it("dédoublonne et accepte une liste vide", () => {
    expect(parseProviderIds([8, 8, 337])).toEqual([8, 337]);
    expect(parseProviderIds([])).toEqual([]);
  });
  it.each([["8"], [[0]], [[8.5]], [Array.from({ length: 51 }, (_, i) => i + 1)]])("refuse %j", (value) => {
    expect(parseProviderIds(value)).toBeNull();
  });
});
