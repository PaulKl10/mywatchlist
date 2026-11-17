import { describe, expect, it } from "vitest";
import { averageRating, formatRating } from "./format";

describe("formatRating", () => {
  it("affiche une note entière sans décimale", () => {
    expect(formatRating(8)).toBe("8");
  });

  it("affiche une demi-note avec une décimale", () => {
    expect(formatRating(7.5)).toBe("7.5");
  });
});

describe("averageRating", () => {
  it("renvoie null sans note", () => {
    expect(averageRating([])).toBeNull();
  });

  it("garde une moyenne tombant sur un demi-point", () => {
    expect(averageRating([8, 7])).toBe(7.5);
    expect(averageRating([10, 6, 6, 6])).toBe(7);
  });

  it("arrondit au demi-point le plus proche", () => {
    expect(averageRating([6, 6, 7])).toBe(6.5); // 6,33
    expect(averageRating([6, 6, 6, 6, 7])).toBe(6); // 6,2
  });
});
