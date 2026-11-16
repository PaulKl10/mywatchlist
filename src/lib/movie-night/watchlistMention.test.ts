import { describe, expect, it } from "vitest";
import { presentDeckMovie } from "./watchlistMention";
import type { TDeckMovie } from "./types";

const base: TDeckMovie = {
  id: 1,
  title: "Film",
  posterPath: null,
  releaseDate: null,
  voteAverage: 7,
  runtime: 100,
  genreIds: [],
  overview: "",
  provider: null,
};
const owners = [
  { userId: "me", name: "Paul" },
  { userId: "friend", name: "Léa" },
  { userId: "stranger", name: "Tom" },
];

describe("presentDeckMovie", () => {
  it("nomme le participant et ses amis, compte les autres, ne transmet jamais watchlistOf", () => {
    const presented = presentDeckMovie({ ...base, watchlistOf: owners }, "me", new Set(["friend"]));
    expect(presented).toEqual({ ...base, watchlist: { me: true, friends: ["Léa"], others: 1 } });
    expect(presented).not.toHaveProperty("watchlistOf");
  });

  it("un invité (sans compte) ne voit que des nombres", () => {
    expect(presentDeckMovie({ ...base, watchlistOf: owners }, null, new Set()).watchlist).toEqual({
      me: false,
      friends: [],
      others: 3,
    });
  });

  it("film hors watchlist : inchangé", () => {
    expect(presentDeckMovie(base, "me", new Set())).toEqual(base);
  });
});
