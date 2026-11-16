import { describe, expect, it } from "vitest";
import { planWatchlistResync, type TLocalWatchlistItem, type TRemoteWatchlist } from "./resync";
import type { TWatchlistSnapshot } from "./snapshot";

const NOW = new Date("2026-11-16T12:00:00Z");

function snapshot(title: string, overrides: Partial<TWatchlistSnapshot> = {}): TWatchlistSnapshot {
  return {
    title,
    poster_path: `/${title}.jpg`,
    release_date: "2020-01-01",
    vote_average: 7,
    overview: `Résumé de ${title}`,
    ...overrides,
  };
}

function local(
  tmdbId: number,
  addedAt: string,
  mediaType: "movie" | "tv" = "movie",
  data: TWatchlistSnapshot = snapshot(`m${tmdbId}`)
): TLocalWatchlistItem {
  return { tmdbId, mediaType, addedAt: new Date(addedAt), snapshot: data };
}

function remote(
  movie: number[],
  tv: number[] = [],
  complete: Partial<Record<"movie" | "tv", boolean>> = {}
): TRemoteWatchlist {
  return {
    movie: {
      items: movie.map((id) => ({ tmdbId: id, snapshot: snapshot(`m${id}`) })),
      complete: complete.movie ?? true,
    },
    tv: {
      items: tv.map((id) => ({ tmdbId: id, snapshot: snapshot(`m${id}`) })),
      complete: complete.tv ?? true,
    },
  };
}

describe("planWatchlistResync", () => {
  it("ne change rien quand la copie est déjà à jour", () => {
    const plan = planWatchlistResync(
      [local(1, "2026-11-10T00:00:00Z"), local(2, "2026-11-01T00:00:00Z")],
      remote([1, 2]),
      NOW
    );
    expect(plan).toEqual({ creates: [], updates: [], deletes: [] });
  });

  it("supprime les médias retirés de la watchlist TMDB", () => {
    const plan = planWatchlistResync(
      [local(1, "2026-11-10T00:00:00Z"), local(2, "2026-11-01T00:00:00Z", "tv")],
      remote([1], []),
      NOW
    );
    expect(plan.deletes).toEqual([{ tmdbId: 2, mediaType: "tv" }]);
  });

  it("ne supprime rien d'un type dont la liste TMDB est tronquée", () => {
    const plan = planWatchlistResync(
      [local(1, "2026-11-10T00:00:00Z"), local(2, "2026-11-01T00:00:00Z")],
      remote([1], [], { movie: false }),
      NOW
    );
    expect(plan.deletes).toEqual([]);
  });

  it("met à jour les données qui ont changé sur TMDB, sans toucher à la date d'ajout", () => {
    const plan = planWatchlistResync(
      [local(1, "2026-11-10T00:00:00Z", "movie", snapshot("m1", { poster_path: "/ancienne.jpg" }))],
      remote([1]),
      NOW
    );
    expect(plan.updates).toEqual([{ tmdbId: 1, mediaType: "movie", snapshot: snapshot("m1") }]);
    expect(plan.creates).toEqual([]);
  });

  it("place un ajout fait sur TMDB juste sous son voisin plus récent", () => {
    // Ordre TMDB (du plus récent au plus ancien) : 1, 3 (nouveau), 2.
    const plan = planWatchlistResync(
      [local(1, "2026-11-10T00:00:00Z"), local(2, "2026-11-01T00:00:00Z")],
      remote([1, 3, 2]),
      NOW
    );
    expect(plan.creates).toEqual([
      {
        tmdbId: 3,
        mediaType: "movie",
        snapshot: snapshot("m3"),
        addedAt: new Date(new Date("2026-11-10T00:00:00Z").getTime() - 1),
      },
    ]);
  });

  it("place en tête, dans l'ordre TMDB, les ajouts plus récents que toute la copie", () => {
    const plan = planWatchlistResync([local(1, "2026-11-10T00:00:00Z")], remote([4, 5, 1]), NOW);
    expect(plan.creates.map((c) => [c.tmdbId, c.addedAt.getTime()])).toEqual([
      [4, NOW.getTime() - 1],
      [5, NOW.getTime() - 2],
    ]);
  });

  it("place sous toute la copie les ajouts plus anciens qu'elle", () => {
    const plan = planWatchlistResync([local(1, "2026-11-10T00:00:00Z")], remote([1, 6]), NOW);
    expect(plan.creates[0].addedAt).toEqual(new Date(new Date("2026-11-10T00:00:00Z").getTime() - 1));
  });

  it("traite films et séries séparément, même avec le même identifiant TMDB", () => {
    const plan = planWatchlistResync([local(7, "2026-11-10T00:00:00Z", "movie")], remote([7], [7]), NOW);
    expect(plan.creates).toEqual([
      { tmdbId: 7, mediaType: "tv", snapshot: snapshot("m7"), addedAt: new Date(NOW.getTime() - 1) },
    ]);
    expect(plan.deletes).toEqual([]);
  });

  it("ignore un doublon renvoyé par TMDB d'une page à l'autre", () => {
    const plan = planWatchlistResync([], remote([8, 8]), NOW);
    expect(plan.creates.map((c) => c.tmdbId)).toEqual([8]);
  });
});
