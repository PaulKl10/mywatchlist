import { describe, expect, it } from "vitest";
import { excludeKnown, mediaKey, pickSeeds, type TRatedTitle } from "./seeds";

function rated(id: number, rating: number, mediaType: "movie" | "tv" = "movie"): TRatedTitle {
  return { id, mediaType, title: `t${id}`, rating };
}

describe("pickSeeds", () => {
  it("ne propose rien sans note de 7 ou plus", () => {
    expect(pickSeeds([rated(1, 6.5)], [rated(2, 5, "tv")], () => 0)).toEqual([]);
  });

  it("un titre noté 7 compte comme aimé", () => {
    expect(pickSeeds([rated(1, 7)], [], () => 0)).toEqual([{ id: 1, mediaType: "movie", title: "t1" }]);
  });

  it("1re rangée : au hasard parmi les 5 derniers films et 5 dernières séries bien notés", () => {
    const movies = [1, 2, 3, 4, 5, 6, 7].map((id) => rated(id, 9));
    const tv = [11, 12, 13].map((id) => rated(id, 8, "tv"));
    const recent = new Set([1, 2, 3, 4, 5, 11, 12, 13]);
    const firsts = new Set(
      [0, 0.2, 0.45, 0.7, 0.99].map((r) => pickSeeds([rated(0, 6), ...movies], tv, () => r)[0].id)
    );
    expect(firsts.size).toBeGreaterThan(1);
    for (const id of firsts) expect(recent.has(id)).toBe(true);
  });

  it("2e rangée : au hasard parmi tous les autres coups de cœur", () => {
    const movies = [1, 2, 3, 4, 5, 6, 7].map((id) => rated(id, 9));
    const values = [0, 0.99];
    const seeds = pickSeeds(movies, [], () => values.shift() ?? 0);
    expect(seeds.map((s) => s.id)).toEqual([1, 7]);
  });

  it("prend la dernière bonne note de série quand aucun film n'est bien noté", () => {
    expect(pickSeeds([rated(1, 4)], [rated(5, 8, "tv")], () => 0)).toEqual([
      { id: 5, mediaType: "tv", title: "t5" },
    ]);
  });

  it("ne tire jamais deux fois le même titre", () => {
    const seeds = pickSeeds([rated(1, 9), rated(2, 9)], [], () => 0);
    expect(seeds.map((s) => s.id)).toEqual([1, 2]);
  });

  it("distingue un film et une série de même identifiant", () => {
    const seeds = pickSeeds([rated(7, 9)], [rated(7, 9, "tv")], () => 0);
    expect(seeds).toEqual([
      { id: 7, mediaType: "movie", title: "t7" },
      { id: 7, mediaType: "tv", title: "t7" },
    ]);
  });
});

describe("excludeKnown", () => {
  it("retire les titres connus et les doublons, et borne le nombre", () => {
    const known = new Set([mediaKey("movie", 2)]);
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 1 }, { id: 4 }];
    expect(excludeKnown(items, "movie", known, 2)).toEqual([{ id: 1 }, { id: 3 }]);
  });

  it("ne confond pas un film connu avec une série de même identifiant", () => {
    const known = new Set([mediaKey("movie", 1)]);
    expect(excludeKnown([{ id: 1 }], "tv", known, 10)).toEqual([{ id: 1 }]);
  });
});
