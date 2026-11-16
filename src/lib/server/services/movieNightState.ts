/**
 * Construction de l'état renvoyé par `GET /api/movie-night/[id]` à partir des lignes chargées.
 * Fonctions pures (aucun accès base ni TMDB), testées dans movieNightState.test.ts.
 */
import type { MovieNight, MovieNightParticipant, Prisma, User } from "@prisma/client";
import { TMDB_IMAGE_BASE } from "@/lib/constants";
import {
  canParticipantDecide,
  computePodium,
  computeRoundMatches,
  getActiveParticipantIds,
  hasEveryoneFinished,
} from "@/lib/movie-night/rules";
import type {
  TDeckMovie,
  TMovieNightSettings,
  TMovieNightState,
  TMovieNightStatus,
  TParticipantLike,
  TParticipantStatus,
  TParticipantView,
  TVote,
} from "@/lib/movie-night/types";

export const USER_DISPLAY_SELECT = {
  tmdb_id: true,
  username: true,
  gravatar_hash: true,
  tmdb_avatar_path: true,
} as const satisfies Prisma.UserSelect;

export type TUserDisplay = Pick<User, "tmdb_id" | "username" | "gravatar_hash" | "tmdb_avatar_path">;

export const VOTE_SELECT = {
  participantId: true,
  tmdb_movie_id: true,
  liked: true,
} as const satisfies Prisma.MovieNightVoteSelect;

const MOVIE_NIGHT_STATUSES: readonly TMovieNightStatus[] = ["LOBBY", "SWIPING", "MATCH", "ENDED"];
const PARTICIPANT_STATUSES: readonly TParticipantStatus[] = [
  "INVITED",
  "JOINED",
  "DECLINED",
  "LEFT",
  "REMOVED",
];

export function toMovieNightStatus(value: string): TMovieNightStatus {
  const status = MOVIE_NIGHT_STATUSES.find((s) => s === value);
  if (!status) throw new Error(`Statut de session inconnu : ${value}`);
  return status;
}

export function toParticipantStatus(value: string): TParticipantStatus {
  const status = PARTICIPANT_STATUSES.find((s) => s === value);
  if (!status) throw new Error(`Statut de participant inconnu : ${value}`);
  return status;
}

/** Réglages d'une session, depuis ses colonnes. */
export function toMovieNightSettings(
  night: Pick<MovieNight, "provider_ids" | "genre_ids" | "include_seen" | "from_watchlists">
): TMovieNightSettings {
  return {
    providerIds: night.provider_ids,
    genreIds: night.genre_ids,
    includeSeen: night.include_seen,
    fromWatchlists: night.from_watchlists,
  };
}

/** Instantanés d'une pile, tels qu'enregistrés par le service (colonne JSON). */
export function parseDeck(movies: Prisma.JsonValue): TDeckMovie[] {
  return Array.isArray(movies) ? (movies as unknown as TDeckMovie[]) : [];
}

export function toVote(row: { participantId: string; tmdb_movie_id: number; liked: boolean }): TVote {
  return { participantId: row.participantId, movieId: row.tmdb_movie_id, liked: row.liked };
}

export function toParticipantLike(
  p: Pick<MovieNightParticipant, "id" | "status" | "isHost" | "lastSeenAt">
): TParticipantLike {
  return { id: p.id, status: toParticipantStatus(p.status), isHost: p.isHost, lastSeenAt: p.lastSeenAt };
}

export function userDisplayName(user: Pick<User, "tmdb_id" | "username">): string {
  return user.username || `Utilisateur ${user.tmdb_id}`;
}

/** Gravatar, sinon avatar TMDB (w185), comme FriendsList. */
export function userAvatarUrl(user: Pick<User, "gravatar_hash" | "tmdb_avatar_path">): string | null {
  if (user.gravatar_hash) {
    return `https://secure.gravatar.com/avatar/${user.gravatar_hash}?s=64&d=identicon`;
  }
  return user.tmdb_avatar_path ? `${TMDB_IMAGE_BASE}/w185${user.tmdb_avatar_path}` : null;
}

export function participantDisplayName(p: {
  guestName: string | null;
  user: Pick<User, "tmdb_id" | "username"> | null;
}): string {
  return p.user ? userDisplayName(p.user) : (p.guestName ?? "Invité");
}

/** Un pseudo est pris si un participant porte déjà ce nom, sans tenir compte de la casse. */
export function isNameTaken(name: string, takenNames: string[]): boolean {
  const key = (value: string) => value.normalize("NFC").toLocaleLowerCase("fr-FR");
  const wanted = key(name);
  return takenNames.some((taken) => key(taken) === wanted);
}

export type TStateParticipant = Pick<
  MovieNightParticipant,
  "id" | "userId" | "guestName" | "status" | "isHost" | "lastSeenAt"
> & { user: TUserDisplay | null };

export type TMovieNightStateInput = {
  night: Pick<
    MovieNight,
    | "id"
    | "code"
    | "status"
    | "provider_ids"
    | "genre_ids"
    | "include_seen"
    | "from_watchlists"
    | "pending_match_movie_id"
    | "chosen_movie_id"
  >;
  /** Tous les participants, quel que soit leur statut, dans l'ordre d'affichage. */
  participants: TStateParticipant[];
  /** Piles par index croissant ; la dernière est la pile courante. */
  rounds: { index: number; movies: TDeckMovie[] }[];
  /** Votes de la pile courante. */
  currentVotes: TVote[];
  /** Matchs continués de la pile courante (`continued_match_movie_ids`). */
  currentContinuedMatchIds: number[];
  meId: string;
  now: Date;
};

function findDeckMovie(
  rounds: TMovieNightStateInput["rounds"],
  movieId: number | null
): TDeckMovie | null {
  if (movieId === null) return null;
  for (let i = rounds.length - 1; i >= 0; i--) {
    const movie = rounds[i].movies.find((m) => m.id === movieId);
    if (movie) return movie;
  }
  return null;
}

/** État vu par le participant `meId`. Ne contient jamais les votes individuels des autres. */
export function buildMovieNightState(input: TMovieNightStateInput): TMovieNightState {
  const { night, participants, rounds, currentVotes: votes, currentContinuedMatchIds, meId, now } =
    input;
  const status = toMovieNightStatus(night.status);
  const likes = participants.map(toParticipantLike);
  const activeIds = getActiveParticipantIds(likes, now);
  const activeSet = new Set(activeIds);
  const current = rounds.at(-1) ?? null;
  const deck = current?.movies ?? [];

  const matchIds = new Set(computeRoundMatches(deck, votes, activeIds, currentContinuedMatchIds));
  const matches = deck.filter((m) => matchIds.has(m.id));
  const everyoneFinished = hasEveryoneFinished(deck, votes, activeIds);

  const votedByParticipant = new Map<string, Set<number>>();
  for (const v of votes) {
    const set = votedByParticipant.get(v.participantId) ?? new Set<number>();
    set.add(v.movieId);
    votedByParticipant.set(v.participantId, set);
  }

  const views: TParticipantView[] = participants
    .filter((p) => p.status === "JOINED")
    .map((p) => {
      const voted = votedByParticipant.get(p.id) ?? new Set<number>();
      return {
        id: p.id,
        userId: p.userId,
        name: participantDisplayName(p),
        avatarUrl: p.user ? userAvatarUrl(p.user) : null,
        isHost: p.isHost,
        isGuest: p.userId === null,
        isActive: activeSet.has(p.id),
        votedCount: voted.size,
        hasFinished: deck.length > 0 && deck.every((m) => voted.has(m.id)),
      };
    });

  const me = participants.find((p) => p.id === meId);
  const myVotes: Record<number, boolean> = {};
  for (const v of votes) {
    if (v.participantId === meId) myVotes[v.movieId] = v.liked;
  }

  return {
    id: night.id,
    status,
    code: status === "LOBBY" ? night.code : null,
    settings: toMovieNightSettings(night),
    me: { participantId: meId, isHost: me?.isHost ?? false, isGuest: me ? me.userId === null : false },
    canDecide: canParticipantDecide(meId, likes, now),
    participants: views,
    invitedFriendIds:
      me?.isHost && status === "LOBBY"
        ? participants.flatMap((p) => (p.status === "INVITED" && p.userId ? [p.userId] : []))
        : [],
    round: current ? { index: current.index, deck } : null,
    myVotes,
    pendingMatch: status === "MATCH" ? findDeckMovie(rounds, night.pending_match_movie_id) : null,
    matches,
    everyoneFinished,
    podium: everyoneFinished && matches.length === 0 ? computePodium(deck, votes, activeIds) : null,
    chosenMovie: findDeckMovie(rounds, night.chosen_movie_id),
  };
}
