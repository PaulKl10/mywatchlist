import { describe, expect, it } from "vitest";
import { excludeKnown, mediaKey, pickSeeds, type TRatedTitle } from "./seeds";

function rated(id: number, rating: number, mediaType: "movie" | "tv" = "movie"): TRatedTitle {
  return { id, mediaType, title: `t${id}`, rating };
}

describe("pickSeeds", () => {
  it("ne propose rien sans note de 8 ou plus", () => {
    expect(pickSeeds([rated(1, 7)], [rated(2, 5, "tv")], () => 0)).toEqual([]);
  });

  it("part de la dernière bonne note, puis d'un coup de cœur tiré au hasard parmi les autres", () => {
    const seeds = pickSeeds(
      [rated(1, 6), rated(2, 9), rated(3, 8)],
      [rated(4, 10, "tv")],
      () => 0.99
    );
    expect(seeds).toEqual([
      { id: 2, mediaType: "movie", title: "t2" },
      { id: 4, mediaType: "tv", title: "t4" },
    ]);
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
