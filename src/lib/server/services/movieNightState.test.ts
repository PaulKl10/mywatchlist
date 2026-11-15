import { describe, expect, it } from "vitest";
import type { TDeckMovie, TVote } from "@/lib/movie-night/types";
import {
  buildMovieNightState,
  isNameTaken,
  participantDisplayName,
  toMovieNightStatus,
  toParticipantStatus,
  userAvatarUrl,
  userDisplayName,
  type TMovieNightStateInput,
  type TStateParticipant,
} from "./movieNightState";

const NOW = new Date("2026-11-15T21:00:00Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms);
const movie = (id: number): TDeckMovie => ({
  id, title: `Film ${id}`, posterPath: null, releaseDate: null, voteAverage: 7,
  runtime: 100, genreIds: [], overview: "", provider: null,
});
const vote = (participantId: string, movieId: number, liked: boolean): TVote => ({
  participantId, movieId, liked,
});
const user = (tmdb_id: number, username: string | null) => ({
  tmdb_id, username, gravatar_hash: null, tmdb_avatar_path: null,
});

const host: TStateParticipant = {
  id: "p-host", userId: "u-host", guestName: null, status: "JOINED", isHost: true,
  lastSeenAt: ago(1_000), user: user(1, "Paul"),
};
const guest: TStateParticipant = {
  id: "p-guest", userId: null, guestName: "Léa", status: "JOINED", isHost: false,
  lastSeenAt: ago(1_000), user: null,
};
const invited: TStateParticipant = {
  id: "p-invited", userId: "u-friend", guestName: null, status: "INVITED", isHost: false,
  lastSeenAt: ago(1_000), user: user(3, "Max"),
};
const deck = [movie(10), movie(20), movie(30)];

function input(over: Partial<TMovieNightStateInput> = {}, night: Partial<TMovieNightStateInput["night"]> = {}): TMovieNightStateInput {
  return {
    night: {
      id: "mn1", code: "K7P2QX", status: "SWIPING", provider_ids: [8], genre_ids: [35],
      deck_size: 10, include_seen: false, pending_match_movie_id: null, chosen_movie_id: null,
      ...night,
    },
    participants: [host, guest, invited],
    rounds: [{ index: 1, movies: deck }],
    currentVotes: [],
    currentContinuedMatchIds: [],
    meId: host.id,
    now: NOW,
    ...over,
  };
}

describe("statuts", () => {
  it("accepte les statuts connus et refuse les autres", () => {
    expect(toMovieNightStatus("MATCH")).toBe("MATCH");
    expect(toParticipantStatus("REMOVED")).toBe("REMOVED");
    expect(() => toMovieNightStatus("PAUSED")).toThrow();
    expect(() => toParticipantStatus("joined")).toThrow();
  });
});

describe("affichage des participants", () => {
  it("nom : username, sinon « Utilisateur <tmdb_id> »", () => {
    expect(userDisplayName(user(42, "paul"))).toBe("paul");
    expect(userDisplayName(user(42, null))).toBe("Utilisateur 42");
    expect(userDisplayName(user(42, ""))).toBe("Utilisateur 42");
  });
  it("pseudo pour un invité", () => {
    expect(participantDisplayName({ guestName: "Léa", user: null })).toBe("Léa");
    expect(participantDisplayName({ guestName: null, user: user(7, "Max") })).toBe("Max");
  });
  it("avatar : Gravatar, sinon TMDB w185, sinon null", () => {
    expect(userAvatarUrl({ gravatar_hash: "abc", tmdb_avatar_path: "/x.jpg" })).toBe(
      "https://secure.gravatar.com/avatar/abc?s=64&d=identicon"
    );
    expect(userAvatarUrl({ gravatar_hash: null, tmdb_avatar_path: "/x.jpg" })).toBe(
      "https://image.tmdb.org/t/p/w185/x.jpg"
    );
    expect(userAvatarUrl({ gravatar_hash: null, tmdb_avatar_path: null })).toBeNull();
  });
});

describe("isNameTaken", () => {
  it("ignore la casse, accents compris", () => {
    expect(isNameTaken("léa", ["Paul", "Léa"])).toBe(true);
    expect(isNameTaken("LÉA", ["Léa"])).toBe(true);
    expect(isNameTaken("Lea", ["Léa"])).toBe(false);
    expect(isNameTaken("Max", [])).toBe(false);
  });
});

describe("buildMovieNightState", () => {
  it("salle d'attente : code, participants JOINED seulement, invitations vues par l'hôte", () => {
    const state = buildMovieNightState(input({ rounds: [] }, { status: "LOBBY" }));
    expect(state.code).toBe("K7P2QX");
    expect(state.round).toBeNull();
    expect(state.participants.map((p) => p.name)).toEqual(["Paul", "Léa"]);
    expect(state.participants[1]).toMatchObject({ isGuest: true, isHost: false, avatarUrl: null });
    expect(state.invitedFriendIds).toEqual(["u-friend"]);
    expect(state.me).toEqual({ participantId: "p-host", isHost: true });
    expect(state.settings).toEqual({ providerIds: [8], genreIds: [35], deckSize: 10, includeSeen: false });

    const asGuest = buildMovieNightState(input({ rounds: [], meId: guest.id }, { status: "LOBBY" }));
    expect(asGuest.invitedFriendIds).toEqual([]);
    expect(asGuest.me.isHost).toBe(false);
  });

  it("swipe : mes votes seulement, compteurs des autres, pas de code", () => {
    const state = buildMovieNightState(
      input({ currentVotes: [vote("p-host", 10, true), vote("p-guest", 10, false), vote("p-guest", 20, true)] })
    );
    expect(state.code).toBeNull();
    expect(state.round).toEqual({ index: 1, deck });
    expect(state.myVotes).toEqual({ 10: true });
    expect(state.participants.map((p) => [p.votedCount, p.hasFinished])).toEqual([[1, false], [2, false]]);
    expect(JSON.stringify(state)).not.toContain("liked");
  });

  it("matchs unanimes des actifs, inactifs ignorés", () => {
    const votes = [vote("p-host", 20, true)];
    const sleepy = { ...guest, lastSeenAt: ago(61_000) };
    const state = buildMovieNightState(input({ participants: [host, sleepy], currentVotes: votes }));
    expect(state.matches.map((m) => m.id)).toEqual([20]);
    expect(state.participants.map((p) => p.isActive)).toEqual([true, false]);
  });

  it("un match continué reste dans les matchs quand ceux qui l'aiment changent", () => {
    // 20 a été continué quand Léa était inactive ; elle revient et dit non à 20.
    const votes = [vote("p-host", 20, true), vote("p-guest", 20, false)];
    const state = buildMovieNightState(input({ currentVotes: votes, currentContinuedMatchIds: [20] }));
    expect(state.matches.map((m) => m.id)).toEqual([20]);
  });

  it("tout le monde a fini avec seulement un match continué → pas de podium", () => {
    const votes = [
      vote("p-host", 10, true), vote("p-host", 20, true), vote("p-host", 30, false),
      vote("p-guest", 10, false), vote("p-guest", 20, false), vote("p-guest", 30, false),
    ];
    const state = buildMovieNightState(input({ currentVotes: votes, currentContinuedMatchIds: [20] }));
    expect(state.everyoneFinished).toBe(true);
    expect(state.matches.map((m) => m.id)).toEqual([20]);
    expect(state.podium).toBeNull();
  });

  it("match en attente", () => {
    const votes = [vote("p-host", 20, true), vote("p-guest", 20, true)];
    const state = buildMovieNightState(input({ currentVotes: votes }, { status: "MATCH", pending_match_movie_id: 20 }));
    expect(state.pendingMatch?.id).toBe(20);
    expect(state.matches.map((m) => m.id)).toEqual([20]);
  });

  it("tout le monde a fini sans match → podium ; avec un match → pas de podium", () => {
    const noMatch = [
      vote("p-host", 10, true), vote("p-host", 20, false), vote("p-host", 30, false),
      vote("p-guest", 10, false), vote("p-guest", 20, true), vote("p-guest", 30, false),
    ];
    const state = buildMovieNightState(input({ currentVotes: noMatch }));
    expect(state.everyoneFinished).toBe(true);
    expect(state.participants.every((p) => p.hasFinished)).toBe(true);
    expect(state.podium?.map((e) => e.movie.id)).toEqual([10, 20]);

    const withMatch = noMatch.map((v) => (v.movieId === 30 ? { ...v, liked: true } : v));
    const matched = buildMovieNightState(input({ currentVotes: withMatch }));
    expect(matched.matches.map((m) => m.id)).toEqual([30]);
    expect(matched.podium).toBeNull();
  });

  it("film retenu cherché dans toutes les piles", () => {
    const rounds = [{ index: 1, movies: deck }, { index: 2, movies: [movie(40)] }];
    const state = buildMovieNightState(input({ rounds }, { status: "ENDED", chosen_movie_id: 20 }));
    expect(state.chosenMovie?.id).toBe(20);
    expect(state.round?.index).toBe(2);
  });

  it("droit de décider : l'hôte actif, ou un autre si l'hôte est inactif", () => {
    expect(buildMovieNightState(input()).canDecide).toBe(true);
    expect(buildMovieNightState(input({ meId: guest.id })).canDecide).toBe(false);
    const away = { ...host, lastSeenAt: ago(61_000) };
    expect(buildMovieNightState(input({ participants: [away, guest], meId: guest.id })).canDecide).toBe(true);
  });
});
