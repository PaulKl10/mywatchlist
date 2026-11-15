import { describe, expect, it } from "vitest";
import { parseCreateMovieNightInput, parseGuestName } from "./validation";

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
