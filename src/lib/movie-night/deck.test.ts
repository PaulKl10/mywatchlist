import { describe, expect, it } from "vitest";
import { buildDiscoverParams, pickProviderBadge, selectDeckMovieIds, shufflePageOrder } from "./deck";

const identity = <T,>(items: T[]) => items;

describe("buildDiscoverParams", () => {
  it("plateformes et genres en OU, abonnement uniquement", () => {
    expect(buildDiscoverParams({ providerIds: [8, 337], genreIds: [35, 28], page: 3 })).toEqual({
      with_watch_providers: "8|337", watch_region: "FR", with_watch_monetization_types: "flatrate",
      with_genres: "35|28", sort_by: "popularity.desc", "vote_count.gte": 100,
      include_adult: false, language: "fr-FR", page: 3,
    });
  });
  it("sans genre, pas de with_genres", () => {
    expect(buildDiscoverParams({ providerIds: [8], genreIds: [], page: 1 })).not.toHaveProperty("with_genres");
  });
});

describe("shufflePageOrder", () => {
  it("permutation des 10 premières pages au plus", () => {
    expect([...shufflePageOrder(50)].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect([...shufflePageOrder(2)].sort((a, b) => a - b)).toEqual([1, 2]);
    expect(shufflePageOrder(0)).toEqual([]);
  });
});

describe("selectDeckMovieIds", () => {
  it("dédoublonne, exclut, tronque", () => {
    expect(selectDeckMovieIds([1, 2, 2, 3, 4, 5], new Set([3]), 3, identity)).toEqual([1, 2, 4]);
  });
  it("renvoie moins de films s'il n'y en a pas assez", () => {
    expect(selectDeckMovieIds([1, 2], new Set([2]), 15, identity)).toEqual([1]);
    expect(selectDeckMovieIds([], new Set(), 15, identity)).toEqual([]);
  });
});

describe("pickProviderBadge", () => {
  const flatrate = [
    { provider_id: 8, provider_name: "Netflix", logo_path: "/n.png", display_priority: 5 },
    { provider_id: 337, provider_name: "Disney Plus", logo_path: "/d.png", display_priority: 2 },
    { provider_id: 119, provider_name: "Prime Video", logo_path: "/p.png", display_priority: 1 },
  ];
  it("plateforme choisie à la meilleure priorité", () => {
    expect(pickProviderBadge(flatrate, [8, 337])).toEqual({ id: 337, name: "Disney Plus", logoPath: "/d.png" });
  });
  it("null si aucune plateforme choisie ne propose le film", () => {
    expect(pickProviderBadge(flatrate, [381])).toBeNull();
  });
});
