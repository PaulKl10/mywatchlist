import { describe, expect, it } from "vitest";
import { formatWatchlistMention } from "./watchlistMention";

const mention = (me: boolean, friends: string[], others = 0) => ({ me, friends, others });

describe("formatWatchlistMention", () => {
  it("nomme les amis", () => {
    expect(formatWatchlistMention(mention(false, ["Léa"]))).toBe("Dans la watchlist de Léa");
    expect(formatWatchlistMention(mention(false, ["Léa", "Tom", "Max"]))).toBe(
      "Dans les watchlists de Léa, Tom et Max"
    );
  });

  it("tutoie le participant", () => {
    expect(formatWatchlistMention(mention(true, []))).toBe("Dans ta watchlist");
    expect(formatWatchlistMention(mention(true, ["Léa"]))).toBe("Dans ta watchlist et celle de Léa");
    expect(formatWatchlistMention(mention(true, ["Léa", "Tom"]))).toBe(
      "Dans ta watchlist et celles de Léa et Tom"
    );
  });

  it("dès qu'un propriétaire n'est pas un ami, seulement un nombre", () => {
    expect(formatWatchlistMention(mention(false, [], 1))).toBe("Dans la watchlist d'un participant");
    expect(formatWatchlistMention(mention(false, ["Léa"], 1))).toBe("Dans 2 watchlists du groupe");
    expect(formatWatchlistMention(mention(true, ["Léa"], 1))).toBe(
      "Dans 3 watchlists du groupe, dont la tienne"
    );
  });

  it("rien sans propriétaire", () => {
    expect(formatWatchlistMention(undefined)).toBeNull();
    expect(formatWatchlistMention(mention(false, []))).toBeNull();
  });
});
