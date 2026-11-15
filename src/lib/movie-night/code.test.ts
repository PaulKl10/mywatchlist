import { describe, expect, it } from "vitest";
import { CODE_ALPHABET, CODE_LENGTH } from "./constants";
import { formatMovieNightCode, generateMovieNightCode, normalizeMovieNightCode } from "./code";

describe("generateMovieNightCode", () => {
  it("produit CODE_LENGTH caractères de l'alphabet", () => {
    const code = generateMovieNightCode();
    expect(code).toHaveLength(CODE_LENGTH);
    for (const char of code) expect(CODE_ALPHABET).toContain(char);
  });
  it("utilise le générateur fourni", () => {
    expect(generateMovieNightCode(() => 0)).toBe("222222");
    expect(generateMovieNightCode((max) => max - 1)).toBe("ZZZZZZ");
  });
});

describe("normalizeMovieNightCode", () => {
  it("accepte minuscules, espaces et tiret", () => {
    expect(normalizeMovieNightCode(" k7p-2qx ")).toBe("K7P2QX");
  });
  it("refuse une mauvaise longueur", () => {
    expect(normalizeMovieNightCode("K7P2Q")).toBeNull();
    expect(normalizeMovieNightCode("K7P2QXA")).toBeNull();
  });
  it("refuse les caractères ambigus", () => {
    expect(normalizeMovieNightCode("K7P2QO")).toBeNull();
    expect(normalizeMovieNightCode("K7P21X")).toBeNull();
  });
});

describe("formatMovieNightCode", () => {
  it("insère un tiret au milieu", () => {
    expect(formatMovieNightCode("K7P2QX")).toBe("K7P-2QX");
  });
});
