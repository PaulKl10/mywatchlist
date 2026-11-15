// src/lib/movie-night/rules.test.ts
import { describe, expect, it } from "vitest";
import type { TDeckMovie, TParticipantLike, TVote } from "./types";
import {
  canParticipantDecide, computeMatches, computePodium, computeRoundMatches, findMatchToPause,
  getActiveParticipantIds, hasEveryoneFinished, isParticipantActive,
} from "./rules";

const NOW = new Date("2026-11-15T21:00:00Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms);
const movie = (id: number): TDeckMovie => ({
  id, title: `Film ${id}`, posterPath: null, releaseDate: null, voteAverage: 7,
  runtime: 100, genreIds: [], overview: "", provider: null,
});
const deck = [movie(10), movie(20), movie(30)];
const p = (id: string, over: Partial<TParticipantLike> = {}): TParticipantLike => ({
  id, status: "JOINED", isHost: false, lastSeenAt: ago(1_000), ...over,
});
const yes = (participantId: string, movieId: number): TVote => ({ participantId, movieId, liked: true });
const no = (participantId: string, movieId: number): TVote => ({ participantId, movieId, liked: false });

describe("isParticipantActive", () => {
  it("actif sous 60 s, inactif à 60 s", () => {
    expect(isParticipantActive(p("a", { lastSeenAt: ago(59_999) }), NOW)).toBe(true);
    expect(isParticipantActive(p("a", { lastSeenAt: ago(60_000) }), NOW)).toBe(false);
  });
  it("seul le statut JOINED compte", () => {
    expect(isParticipantActive(p("a", { status: "LEFT" }), NOW)).toBe(false);
    expect(isParticipantActive(p("a", { status: "INVITED" }), NOW)).toBe(false);
  });
  it("getActiveParticipantIds filtre", () => {
    expect(getActiveParticipantIds([p("a"), p("b", { lastSeenAt: ago(90_000) })], NOW)).toEqual(["a"]);
  });
});

describe("computeRoundMatches", () => {
  it("un match continué reste un match quand l'unanimité change, ordre de la pile", () => {
    // 30 a été continué quand b était inactif ; b revient et dit non à 30.
    const votes = [yes("a", 30), no("b", 30), yes("a", 10), yes("b", 10)];
    expect(computeMatches(deck, votes, ["a", "b"])).toEqual([10]);
    expect(computeRoundMatches(deck, votes, ["a", "b"], [30])).toEqual([10, 30]);
  });
  it("sans doublon, et seulement des films de la pile", () => {
    const votes = [yes("a", 20), yes("b", 20)];
    expect(computeRoundMatches(deck, votes, ["a", "b"], [20, 99])).toEqual([20]);
    expect(computeRoundMatches(deck, [], [], [10])).toEqual([10]);
  });
});

describe("computeMatches", () => {
  it("unanimité des actifs, dans l'ordre de la pile", () => {
    const votes = [yes("a", 30), yes("b", 30), yes("a", 20), yes("b", 20), no("a", 10)];
    expect(computeMatches(deck, votes, ["a", "b"])).toEqual([20, 30]);
  });
  it("ignore les votes et l'absence de vote des non-actifs", () => {
    const votes = [yes("a", 10), yes("b", 10), no("c", 10)];
    expect(computeMatches(deck, votes, ["a", "b"])).toEqual([10]);
  });
  it("solo : le premier oui est un match", () => {
    expect(computeMatches(deck, [no("a", 10), yes("a", 20)], ["a"])).toEqual([20]);
  });
  it("aucun actif, aucun match", () => {
    expect(computeMatches(deck, [yes("a", 10)], [])).toEqual([]);
  });
});

describe("findMatchToPause", () => {
  it("premier match non continué", () => {
    expect(findMatchToPause([10, 20], [10])).toBe(20);
    expect(findMatchToPause([10, 20], [10, 20])).toBeNull();
    expect(findMatchToPause([], [])).toBeNull();
  });
});

describe("hasEveryoneFinished", () => {
  const allVotes = (id: string) => deck.map((m) => no(id, m.id));
  it("vrai quand chaque actif a voté sur toute la pile", () => {
    expect(hasEveryoneFinished(deck, [...allVotes("a"), ...allVotes("b")], ["a", "b"])).toBe(true);
  });
  it("faux s'il manque un vote d'un actif", () => {
    expect(hasEveryoneFinished(deck, [...allVotes("a"), no("b", 10)], ["a", "b"])).toBe(false);
  });
  it("ignore les non-actifs, faux sans actif", () => {
    expect(hasEveryoneFinished(deck, allVotes("a"), ["a"])).toBe(true);
    expect(hasEveryoneFinished(deck, [], [])).toBe(false);
  });
});

describe("computePodium", () => {
  it("tri par oui puis ordre de pile, sans film à zéro oui", () => {
    const votes = [
      yes("a", 10), yes("b", 10), no("c", 10),
      yes("a", 20), no("b", 20), no("c", 20),
      no("a", 30), yes("b", 30), yes("c", 30),
      yes("x", 20), // non actif : ignoré
    ];
    const podium = computePodium(deck, votes, ["a", "b", "c"]);
    expect(podium.map((e) => [e.movie.id, e.yesCount, e.voterCount])).toEqual([
      [10, 2, 3], [30, 2, 3], [20, 1, 3],
    ]);
  });
  it("3 films maximum", () => {
    const big = [movie(1), movie(2), movie(3), movie(4)];
    const votes = big.map((m) => yes("a", m.id));
    expect(computePodium(big, votes, ["a", "b"])).toHaveLength(3);
  });
  it("vide si personne n'a dit oui", () => {
    expect(computePodium(deck, [no("a", 10)], ["a"])).toEqual([]);
  });
});

describe("canParticipantDecide", () => {
  const host = p("h", { isHost: true });
  it("l'hôte actif décide seul", () => {
    expect(canParticipantDecide("h", [host, p("a")], NOW)).toBe(true);
    expect(canParticipantDecide("a", [host, p("a")], NOW)).toBe(false);
  });
  it("hôte inactif : tout participant actif décide", () => {
    const idleHost = p("h", { isHost: true, lastSeenAt: ago(120_000) });
    expect(canParticipantDecide("a", [idleHost, p("a")], NOW)).toBe(true);
  });
  it("un participant inactif ne décide jamais", () => {
    const idle = p("a", { lastSeenAt: ago(120_000) });
    const idleHost = p("h", { isHost: true, lastSeenAt: ago(120_000) });
    expect(canParticipantDecide("a", [idleHost, idle], NOW)).toBe(false);
  });
});
