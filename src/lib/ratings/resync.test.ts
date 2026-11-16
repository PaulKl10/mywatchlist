import { describe, expect, it } from "vitest";
import {
  planRatingsResync,
  type TLocalRating,
  type TRatingSnapshot,
  type TRemoteRatings,
} from "./resync";

const NOW = new Date("2026-11-16T12:00:00Z");

function snap(rating: number, overrides: Partial<TRatingSnapshot> = {}): TRatingSnapshot {
  return {
    rating,
    title: "Titre",
    poster_path: "/p.jpg",
    release_date: "2020-01-01",
    genre_ids: [18],
    ...overrides,
  };
}

const local = (
  tmdbId: number,
  rating: number,
  mediaType: "movie" | "tv" = "movie",
  ratedAt: Date | null = null
): TLocalRating => ({
  tmdbId,
  mediaType,
  snapshot: snap(rating),
  ratedAt,
});

function remote(
  movie: [number, number][],
  tv: [number, number][] = [],
  complete = true
): TRemoteRatings {
  const list = (items: [number, number][]) => ({
    items: items.map(([tmdbId, rating]) => ({ tmdbId, snapshot: snap(rating) })),
    complete,
  });
  return { movie: list(movie), tv: list(tv) };
}

describe("planRatingsResync", () => {
  it("import initial : notes sans date, aucune activité", () => {
    const plan = planRatingsResync([], remote([[1, 8]], [[2, 6]]), NOW, true);
    expect(plan.creates).toEqual([
      { tmdbId: 1, mediaType: "movie", snapshot: snap(8), ratedAt: null },
      { tmdbId: 2, mediaType: "tv", snapshot: snap(6), ratedAt: null },
    ]);
    expect(plan.activities).toEqual([]);
  });

  it("nouvelle note faite sur TMDB : datée maintenant, et une activité", () => {
    const plan = planRatingsResync([local(1, 8)], remote([[3, 9], [1, 8]]), NOW, false);
    expect(plan.creates).toEqual([{ tmdbId: 3, mediaType: "movie", snapshot: snap(9), ratedAt: NOW }]);
    expect(plan.activities).toEqual([{ tmdbId: 3, mediaType: "movie", snapshot: snap(9) }]);
    expect(plan.updates).toEqual([]);
  });

  it("note changée : garde sa première date, avec une activité", () => {
    const first = new Date("2026-11-20T00:00:00Z");
    const plan = planRatingsResync([local(1, 6, "movie", first)], remote([[1, 9]]), NOW, false);
    expect(plan.updates).toEqual([{ tmdbId: 1, mediaType: "movie", snapshot: snap(9) }]);
    expect(plan.activities).toEqual([{ tmdbId: 1, mediaType: "movie", snapshot: snap(9) }]);
  });

  it("note importée sans date puis changée : datée maintenant, avec une activité", () => {
    const plan = planRatingsResync([local(1, 6)], remote([[1, 9]]), NOW, false);
    expect(plan.updates).toEqual([{ tmdbId: 1, mediaType: "movie", snapshot: snap(9), ratedAt: NOW }]);
    expect(plan.activities).toEqual([{ tmdbId: 1, mediaType: "movie", snapshot: snap(9) }]);
  });

  it("données du titre modifiées, note identique : mise à jour sans date ni activité", () => {
    const plan = planRatingsResync(
      [{ tmdbId: 1, mediaType: "movie", snapshot: snap(8, { poster_path: "/ancien.jpg" }), ratedAt: null }],
      remote([[1, 8]]),
      NOW,
      false
    );
    expect(plan.updates).toEqual([{ tmdbId: 1, mediaType: "movie", snapshot: snap(8) }]);
    expect(plan.activities).toEqual([]);
  });

  it("note retirée sur TMDB : supprimée, sauf si la liste est tronquée", () => {
    expect(planRatingsResync([local(1, 8), local(2, 7, "tv")], remote([[1, 8]], []), NOW, false).deletes).toEqual([
      { tmdbId: 2, mediaType: "tv" },
    ]);
    expect(planRatingsResync([local(1, 8), local(2, 7)], remote([[1, 8]], [], false), NOW, false).deletes).toEqual([]);
  });

  it("import initial après une note donnée depuis l'app : rien n'est daté ni ajouté au fil", () => {
    const plan = planRatingsResync([local(1, 9)], remote([[1, 7], [2, 8]]), NOW, true);
    expect(plan.creates).toEqual([{ tmdbId: 2, mediaType: "movie", snapshot: snap(8), ratedAt: null }]);
    expect(plan.updates).toEqual([{ tmdbId: 1, mediaType: "movie", snapshot: snap(7) }]);
    expect(plan.activities).toEqual([]);
  });

  it("ignore un doublon renvoyé par TMDB", () => {
    expect(planRatingsResync([local(9, 5)], remote([[1, 8], [1, 8]]), NOW, false).creates).toHaveLength(1);
  });
});
