import { describe, expect, it } from "vitest";
import type { TMovieNightState, TParticipantView } from "@/lib/movie-night/types";
import { activeHostName, joinNames, waitingNames } from "./participants";

function p(name: string, o: Partial<TParticipantView> = {}): TParticipantView {
  return {
    id: name,
    userId: null,
    name,
    avatarUrl: null,
    isHost: false,
    isGuest: false,
    isActive: true,
    votedCount: 0,
    hasFinished: false,
    ...o,
  };
}
const withParticipants = (participants: TParticipantView[]) =>
  ({ participants }) as TMovieNightState;

describe("joinNames", () => {
  it("gère 0, 1, 2 et 3 noms", () => {
    expect(joinNames([])).toBe("");
    expect(joinNames(["Léa"])).toBe("Léa");
    expect(joinNames(["Léa", "Max"])).toBe("Léa et Max");
    expect(joinNames(["Léa", "Max", "Zoé"])).toBe("Léa, Max et Zoé");
  });
});

describe("activeHostName", () => {
  it("renvoie le nom de l'hôte actif", () => {
    expect(activeHostName(withParticipants([p("Paul", { isHost: true }), p("Léa")]))).toBe("Paul");
  });
  it("renvoie null si l'hôte est inactif ou absent", () => {
    expect(activeHostName(withParticipants([p("Paul", { isHost: true, isActive: false })]))).toBeNull();
    expect(activeHostName(withParticipants([p("Léa")]))).toBeNull();
  });
});

describe("waitingNames", () => {
  it("garde les actifs qui n'ont pas fini", () => {
    const state = withParticipants([
      p("Paul", { hasFinished: true }),
      p("Léa"),
      p("Max", { isActive: false }),
      p("Zoé"),
    ]);
    expect(waitingNames(state)).toEqual(["Léa", "Zoé"]);
  });
  it("renvoie une liste vide si tout le monde a fini", () => {
    expect(waitingNames(withParticipants([p("Paul", { hasFinished: true })]))).toEqual([]);
  });
});
