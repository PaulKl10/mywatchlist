import { describe, expect, it } from "vitest";
import {
  applyReactionChange,
  countReactions,
  emptyReactionCounts,
  parseReaction,
  storedReaction,
} from "./reactions";

describe("parseReaction", () => {
  it.each(["LIKE", "LAUGH", "DISLIKE"])("accepte %s", (value) => {
    expect(parseReaction(value)).toBe(value);
  });
  it.each([undefined, null, "", "like", "LOVE", 1])("refuse %j", (value) => {
    expect(parseReaction(value)).toBeNull();
  });
});

describe("storedReaction", () => {
  it("lit un ancien « J'aime » sans type comme LIKE", () => {
    expect(storedReaction(null)).toBe("LIKE");
    expect(storedReaction("LAUGH")).toBe("LAUGH");
  });
});

describe("countReactions", () => {
  it("compte par type", () => {
    expect(countReactions(["LIKE", "LAUGH", "LIKE", null])).toEqual({ LIKE: 3, LAUGH: 1, DISLIKE: 0 });
  });
});

describe("applyReactionChange", () => {
  const counts = { LIKE: 2, LAUGH: 0, DISLIKE: 1 };

  it("ajoute une réaction", () => {
    expect(applyReactionChange(counts, null, "LAUGH")).toEqual({ LIKE: 2, LAUGH: 1, DISLIKE: 1 });
  });

  it("change de réaction", () => {
    expect(applyReactionChange(counts, "LIKE", "DISLIKE")).toEqual({ LIKE: 1, LAUGH: 0, DISLIKE: 2 });
  });

  it("retire une réaction sans passer sous zéro", () => {
    expect(applyReactionChange(counts, "DISLIKE", null)).toEqual({ LIKE: 2, LAUGH: 0, DISLIKE: 0 });
    expect(applyReactionChange(emptyReactionCounts(), "LAUGH", null)).toEqual(emptyReactionCounts());
  });

  it("ne change rien pour la même réaction", () => {
    expect(applyReactionChange(counts, "LIKE", "LIKE")).toBe(counts);
  });
});
