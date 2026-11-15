/**
 * Recevabilité des actions de jeu (vote, décision, nouvelle pile) d'après l'état lu en base.
 * Fonctions pures : le service vérifie aussi `canParticipantDecide` et rejoue ces conditions
 * sous verrou au moment d'écrire.
 */
import { computeMatches, computePodium, hasEveryoneFinished } from "./rules";
import type { TDeckMovie, TMovieNightErrorCode, TMovieNightStatus, TVote } from "./types";

type TRefusal = TMovieNightErrorCode | null;

/** Vote : refusé pendant un match, hors `SWIPING`, ou pour un film hors de la pile courante. */
export function checkVote(status: TMovieNightStatus, deck: TDeckMovie[], movieId: number): TRefusal {
  if (status === "MATCH") return "match_pending";
  if (status !== "SWIPING") return "wrong_status";
  return deck.some((m) => m.id === movieId) ? null : "invalid_input";
}

/** Films qu'on peut retenir en fin de pile : les matchs s'il y en a, sinon ceux du podium. */
export function finishedRoundChoices(deck: TDeckMovie[], votes: TVote[], activeIds: string[]): number[] {
  const matches = computeMatches(deck, votes, activeIds);
  if (matches.length > 0) return matches;
  return computePodium(deck, votes, activeIds).map((entry) => entry.movie.id);
}

export type TWatchContext = {
  status: TMovieNightStatus;
  pendingMatchMovieId: number | null;
  /** Pile courante et ses votes (utilisés seulement en `SWIPING`). */
  deck: TDeckMovie[];
  votes: TVote[];
  activeIds: string[];
};

/**
 * « On regarde ça » : en `MATCH`, seulement le film du match en attente ; en `SWIPING`, une
 * fois que tous les actifs ont fini la pile, un match ou un film du podium.
 */
export function checkWatchDecision(ctx: TWatchContext, movieId: number): TRefusal {
  if (ctx.status === "MATCH") return movieId === ctx.pendingMatchMovieId ? null : "invalid_input";
  if (ctx.status !== "SWIPING") return "wrong_status";
  if (!hasEveryoneFinished(ctx.deck, ctx.votes, ctx.activeIds)) return "not_finished";
  return finishedRoundChoices(ctx.deck, ctx.votes, ctx.activeIds).includes(movieId)
    ? null
    : "invalid_input";
}

/** « Continuer » : seulement pendant un match. */
export function checkContinueDecision(status: TMovieNightStatus): TRefusal {
  return status === "MATCH" ? null : "wrong_status";
}

/** « Nouvelle pile » : en `SWIPING`, une fois que tous les actifs ont fini la pile courante. */
export function checkNewRound(status: TMovieNightStatus, everyoneFinished: boolean): TRefusal {
  if (status !== "SWIPING") return "wrong_status";
  return everyoneFinished ? null : "not_finished";
}
