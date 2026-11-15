import { describe, expect, it } from "vitest";
import type { TDeckMovie, TVote } from "./types";
import {
  checkContinueDecision, checkNewRound, checkVote, checkWatchDecision, finishedRoundChoices,
  type TWatchContext,
} from "./play";

const movie = (id: number): TDeckMovie => ({
  id, title: `Film ${id}`, posterPath: null, releaseDate: null, voteAverage: 7,
  runtime: 100, genreIds: [], overview: "", provider: null,
});
const deck = [movie(10), movie(20), movie(30)];
const vote = (participantId: string, movieId: number, liked: boolean): TVote => ({
  participantId, movieId, liked,
});
/** Chaque participant vote sur toute la pile ; `likes` donne ses oui. */
const allVotes = (likes: Record<string, number[]>): TVote[] =>
  Object.entries(likes).flatMap(([id, liked]) => deck.map((m) => vote(id, m.id, liked.includes(m.id))));

describe("checkVote", () => {
  it("match_pending pendant un match, wrong_status hors SWIPING", () => {
    expect(checkVote("MATCH", deck, 10)).toBe("match_pending");
    expect(checkVote("LOBBY", deck, 10)).toBe("wrong_status");
    expect(checkVote("ENDED", deck, 10)).toBe("wrong_status");
  });
  it("seulement un film de la pile courante", () => {
    expect(checkVote("SWIPING", deck, 20)).toBeNull();
    expect(checkVote("SWIPING", deck, 99)).toBe("invalid_input");
    expect(checkVote("SWIPING", [], 10)).toBe("invalid_input");
  });
});

describe("finishedRoundChoices", () => {
  it("les matchs s'il y en a", () => {
    const votes = allVotes({ a: [10, 30], b: [30] });
    expect(finishedRoundChoices(deck, votes, ["a", "b"], [])).toEqual([30]);
  });
  it("les matchs continués comptent comme des matchs", () => {
    // 10 continué quand b était inactif ; b a dit non à 10 depuis. 30 est un match.
    const votes = allVotes({ a: [10, 30], b: [30] });
    expect(finishedRoundChoices(deck, votes, ["a", "b"], [10])).toEqual([10, 30]);
  });
  it("sinon le podium (au moins un oui), par oui décroissants", () => {
    const votes = allVotes({ a: [10, 20], b: [20], c: [] });
    expect(finishedRoundChoices(deck, votes, ["a", "b", "c"], [])).toEqual([20, 10]);
    expect(finishedRoundChoices(deck, allVotes({ a: [], b: [] }), ["a", "b"], [])).toEqual([]);
  });
});

describe("checkWatchDecision", () => {
  const ctx = (over: Partial<TWatchContext>): TWatchContext => ({
    status: "SWIPING", pendingMatchMovieId: null, deck, votes: [], continuedMatchMovieIds: [],
    activeIds: ["a", "b"], ...over,
  });

  it("en MATCH : seulement le film en attente", () => {
    expect(checkWatchDecision(ctx({ status: "MATCH", pendingMatchMovieId: 20 }), 20)).toBeNull();
    expect(checkWatchDecision(ctx({ status: "MATCH", pendingMatchMovieId: 20 }), 10)).toBe("invalid_input");
  });
  it("wrong_status en LOBBY et ENDED", () => {
    expect(checkWatchDecision(ctx({ status: "LOBBY" }), 10)).toBe("wrong_status");
    expect(checkWatchDecision(ctx({ status: "ENDED" }), 10)).toBe("wrong_status");
  });
  it("en SWIPING : not_finished tant qu'un actif n'a pas fini", () => {
    const votes = [...allVotes({ a: [10] }), vote("b", 10, true)];
    expect(checkWatchDecision(ctx({ votes }), 10)).toBe("not_finished");
  });
  it("en SWIPING, pile finie avec matchs : un match, pas un autre film", () => {
    const votes = allVotes({ a: [10, 20], b: [20] });
    expect(checkWatchDecision(ctx({ votes }), 20)).toBeNull();
    expect(checkWatchDecision(ctx({ votes }), 10)).toBe("invalid_input");
  });
  it("en SWIPING, pile finie sans match : un film du podium", () => {
    const votes = allVotes({ a: [10], b: [20] });
    expect(checkWatchDecision(ctx({ votes }), 10)).toBeNull();
    expect(checkWatchDecision(ctx({ votes }), 30)).toBe("invalid_input");
    expect(checkWatchDecision(ctx({ votes }), 99)).toBe("invalid_input");
  });
  it("pile finie : un match continué reste choisissable, même à côté d'un autre match", () => {
    // 10 continué quand b était inactif ; b revenu a dit non à 10. 30 est un match.
    const votes = allVotes({ a: [10, 30], b: [30] });
    expect(checkWatchDecision(ctx({ votes }), 10)).toBe("invalid_input");
    expect(checkWatchDecision(ctx({ votes, continuedMatchMovieIds: [10] }), 10)).toBeNull();
    expect(checkWatchDecision(ctx({ votes, continuedMatchMovieIds: [10] }), 30)).toBeNull();
    expect(checkWatchDecision(ctx({ votes, continuedMatchMovieIds: [10] }), 20)).toBe("invalid_input");
  });
  it("les votes d'un inactif ne comptent pas", () => {
    // b inactif : a seul a fini la pile, et ses oui sont des matchs.
    const votes = [...allVotes({ a: [30] }), vote("b", 10, true)];
    expect(checkWatchDecision(ctx({ votes, activeIds: ["a"] }), 30)).toBeNull();
    expect(checkWatchDecision(ctx({ votes, activeIds: ["a"] }), 10)).toBe("invalid_input");
  });
});

describe("checkContinueDecision", () => {
  it("seulement en MATCH", () => {
    expect(checkContinueDecision("MATCH", 20)).toBeNull();
    expect(checkContinueDecision("SWIPING", null)).toBe("wrong_status");
    expect(checkContinueDecision("ENDED", null)).toBe("wrong_status");
  });
  it("sans movieId : accepté en MATCH", () => {
    expect(checkContinueDecision("MATCH", 20, undefined)).toBeNull();
  });
  it("avec movieId : seulement le match en attente", () => {
    expect(checkContinueDecision("MATCH", 20, 20)).toBeNull();
    expect(checkContinueDecision("MATCH", 20, 10)).toBe("wrong_status");
    expect(checkContinueDecision("SWIPING", null, 20)).toBe("wrong_status");
  });
});

describe("checkNewRound", () => {
  it("SWIPING et tout le monde a fini", () => {
    expect(checkNewRound("SWIPING", true)).toBeNull();
    expect(checkNewRound("SWIPING", false)).toBe("not_finished");
  });
  it("wrong_status hors SWIPING, même si tout le monde a fini", () => {
    expect(checkNewRound("MATCH", true)).toBe("wrong_status");
    expect(checkNewRound("LOBBY", true)).toBe("wrong_status");
    expect(checkNewRound("ENDED", true)).toBe("wrong_status");
  });
});
