import { describe, expect, it } from "vitest";
import { availableBilanYears, computeBilan, yearRange, type TBilanRating } from "./compute";

function rating(over: Partial<TBilanRating> & Pick<TBilanRating, "tmdbId">): TBilanRating {
  return {
    mediaType: "movie",
    title: `t${over.tmdbId}`,
    posterPath: null,
    releaseDate: "2001-05-01",
    genreIds: [],
    rating: 7,
    ratedAt: null,
    ...over,
  };
}

describe("computeBilan", () => {
  it("sans note : compteurs à zéro, pas de moyenne ni de décennie", () => {
    expect(computeBilan([], 0)).toEqual({
      ratedMovies: 0,
      ratedTv: 0,
      totalMinutes: 0,
      averageRating: null,
      topGenres: [],
      topRated: [],
      favoriteDecade: null,
    });
  });

  it("compte films et séries, moyenne arrondie au dixième", () => {
    const bilan = computeBilan(
      [rating({ tmdbId: 1, rating: 8 }), rating({ tmdbId: 2, rating: 7 }), rating({ tmdbId: 3, mediaType: "tv", rating: 6 })],
      540
    );
    expect(bilan.ratedMovies).toBe(2);
    expect(bilan.ratedTv).toBe(1);
    expect(bilan.totalMinutes).toBe(540);
    expect(bilan.averageRating).toBe(7);
  });

  it("genres les plus présents, 5 au plus, à égalité par id", () => {
    const bilan = computeBilan(
      [
        rating({ tmdbId: 1, genreIds: [18, 35] }),
        rating({ tmdbId: 2, genreIds: [18] }),
        rating({ tmdbId: 3, genreIds: [28, 12, 16, 99, 80] }),
      ],
      0
    );
    expect(bilan.topGenres).toEqual([
      { id: 18, count: 2 },
      { id: 12, count: 1 },
      { id: 16, count: 1 },
      { id: 28, count: 1 },
      { id: 35, count: 1 },
    ]);
  });

  it("meilleures notes : note puis note la plus récente, 6 au plus", () => {
    const ratings = [
      rating({ tmdbId: 1, rating: 9, ratedAt: new Date("2027-01-01") }),
      rating({ tmdbId: 2, rating: 9, ratedAt: new Date("2027-03-01") }),
      rating({ tmdbId: 3, rating: 10 }),
      ...[4, 5, 6, 7, 8].map((id) => rating({ tmdbId: id, rating: 5 })),
    ];
    expect(computeBilan(ratings, 0).topRated.map((t) => t.tmdbId)).toEqual([3, 2, 1, 4, 5, 6]);
  });

  it("décennie préférée, la plus récente à égalité, sans date de sortie ignorée", () => {
    const bilan = computeBilan(
      [
        rating({ tmdbId: 1, releaseDate: "1994-01-01" }),
        rating({ tmdbId: 2, releaseDate: "1999-01-01" }),
        rating({ tmdbId: 3, releaseDate: "2012-01-01" }),
        rating({ tmdbId: 4, releaseDate: "2015-01-01" }),
        rating({ tmdbId: 5, releaseDate: null }),
      ],
      0
    );
    expect(bilan.favoriteDecade).toEqual({ decade: 2010, count: 2 });
  });
});

describe("availableBilanYears", () => {
  it("années à partir de 2027 ayant des notes datées, de la plus récente à la plus ancienne", () => {
    expect(
      availableBilanYears([
        new Date("2026-12-20T00:00:00Z"),
        new Date("2027-02-01T00:00:00Z"),
        new Date("2028-06-01T00:00:00Z"),
        new Date("2027-08-01T00:00:00Z"),
      ])
    ).toEqual([2028, 2027]);
  });
});

describe("yearRange", () => {
  it("du 1er janvier au 1er janvier suivant (UTC)", () => {
    expect(yearRange(2027)).toEqual({
      start: new Date("2027-01-01T00:00:00Z"),
      end: new Date("2028-01-01T00:00:00Z"),
    });
  });
});
