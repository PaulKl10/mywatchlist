import { describe, expect, it } from "vitest";
import type { TDeckMovie } from "@/lib/movie-night/types";
import { firstUnvotedIndex, resolveSwipe } from "./swipe";

describe("resolveSwipe", () => {
  it("distance au-delà du seuil", () => {
    expect(resolveSwipe(120, 0.1)).toBe("right");
    expect(resolveSwipe(-120, -0.1)).toBe("left");
  });
  it("geste rapide et court", () => {
    expect(resolveSwipe(40, 0.8)).toBe("right");
    expect(resolveSwipe(-40, -0.8)).toBe("left");
  });
  it("ni assez loin ni assez vite : la carte revient", () => {
    expect(resolveSwipe(40, 0.2)).toBeNull();
    expect(resolveSwipe(0, 0)).toBeNull();
  });
});

describe("firstUnvotedIndex", () => {
  const deck = [10, 20, 30].map((id) => ({ id }) as TDeckMovie);
  it("reprend à la première carte non votée (Review Focus 1)", () => {
    expect(firstUnvotedIndex(deck, {})).toBe(0);
    expect(firstUnvotedIndex(deck, { 10: true, 20: false })).toBe(2);
    expect(firstUnvotedIndex(deck, { 20: true })).toBe(0);
  });
  it("toute la pile votée → longueur de la pile", () => {
    expect(firstUnvotedIndex(deck, { 10: true, 20: false, 30: true })).toBe(3);
  });
});
