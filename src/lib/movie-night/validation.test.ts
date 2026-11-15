import { describe, expect, it } from "vitest";
import {
  parseCreateMovieNightInput,
  parseGuestName,
  parseMovieNightDecision,
  parseVoteInput,
} from "./validation";

describe("parseCreateMovieNightInput", () => {
  it("normalise une entrée valide", () => {
    expect(parseCreateMovieNightInput({ providerIds: [8, 8, 337], genreIds: [35], deckSize: 15 })).toEqual({
      ok: true,
      value: { providerIds: [8, 337], genreIds: [35], deckSize: 15, includeSeen: false, solo: false },
    });
  });
  it.each([
    [{ providerIds: [], genreIds: [], deckSize: 15 }],
    [{ providerIds: [8], genreIds: [], deckSize: 12 }],
    [{ providerIds: [8], genreIds: [999], deckSize: 15 }],
    [{ providerIds: "8", genreIds: [], deckSize: 15 }],
    [{ providerIds: [8.5], genreIds: [], deckSize: 15 }],
    [{ providerIds: Array.from({ length: 51 }, (_, i) => i + 1), genreIds: [], deckSize: 15 }],
    [null],
  ])("refuse %j", (body) => {
    expect(parseCreateMovieNightInput(body).ok).toBe(false);
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
  it("accepte watch avec un film et continue", () => {
    expect(parseMovieNightDecision({ action: "watch", movieId: 550 })).toEqual({ action: "watch", movieId: 550 });
    expect(parseMovieNightDecision({ action: "continue", movieId: 550 })).toEqual({ action: "continue" });
  });
  it.each([
    [{ action: "watch" }],
    [{ action: "watch", movieId: "550" }],
    [{ action: "watch", movieId: 0 }],
    [{ action: "stop" }],
    [{}],
    [null],
  ])("refuse %j", (body) => {
    expect(parseMovieNightDecision(body)).toBeNull();
  });
});
