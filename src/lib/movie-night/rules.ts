import { INACTIVE_AFTER_MS, PODIUM_SIZE } from "./constants";
import type { TDeckMovie, TParticipantLike, TPodiumEntry, TVote } from "./types";

/** Un participant est actif s'il a rejoint la session et s'est manifesté récemment. */
export function isParticipantActive(p: TParticipantLike, now: Date): boolean {
  return p.status === "JOINED" && now.getTime() - p.lastSeenAt.getTime() < INACTIVE_AFTER_MS;
}

export function getActiveParticipantIds(participants: TParticipantLike[], now: Date): string[] {
  return participants.filter((p) => isParticipantActive(p, now)).map((p) => p.id);
}

/** Films aimés par tous les actifs, dans l'ordre de la pile. */
export function computeMatches(deck: TDeckMovie[], votes: TVote[], activeIds: string[]): number[] {
  if (activeIds.length === 0) return [];
  const active = new Set(activeIds);
  const likers = new Map<number, Set<string>>();
  for (const v of votes) {
    if (!v.liked || !active.has(v.participantId)) continue;
    const set = likers.get(v.movieId) ?? new Set<string>();
    set.add(v.participantId);
    likers.set(v.movieId, set);
  }
  return deck.filter((m) => likers.get(m.id)?.size === active.size).map((m) => m.id);
}

/** Premier match que personne n'a encore choisi de continuer. */
export function findMatchToPause(matches: number[], continuedIds: number[]): number | null {
  const continued = new Set(continuedIds);
  return matches.find((id) => !continued.has(id)) ?? null;
}

/** Chaque actif a voté sur chaque film de la pile. */
export function hasEveryoneFinished(deck: TDeckMovie[], votes: TVote[], activeIds: string[]): boolean {
  if (activeIds.length === 0) return false;
  const voted = new Set(votes.map((v) => `${v.participantId}:${v.movieId}`));
  return activeIds.every((id) => deck.every((m) => voted.has(`${id}:${m.id}`)));
}

/** Films avec au moins un oui d'un actif, triés par oui décroissant puis ordre de pile. */
export function computePodium(deck: TDeckMovie[], votes: TVote[], activeIds: string[]): TPodiumEntry[] {
  const active = new Set(activeIds);
  const counts = new Map<number, Set<string>>();
  for (const v of votes) {
    if (!v.liked || !active.has(v.participantId)) continue;
    const set = counts.get(v.movieId) ?? new Set<string>();
    set.add(v.participantId);
    counts.set(v.movieId, set);
  }
  return deck
    .map((movie, index) => ({ movie, index, yesCount: counts.get(movie.id)?.size ?? 0 }))
    .filter((e) => e.yesCount > 0)
    .sort((a, b) => b.yesCount - a.yesCount || a.index - b.index)
    .slice(0, PODIUM_SIZE)
    .map(({ movie, yesCount }) => ({ movie, yesCount, voterCount: activeIds.length }));
}

/** Moi actif, et (je suis l'hôte, ou l'hôte n'est pas actif). */
export function canParticipantDecide(meId: string, participants: TParticipantLike[], now: Date): boolean {
  const me = participants.find((p) => p.id === meId);
  if (!me || !isParticipantActive(me, now)) return false;
  if (me.isHost) return true;
  const host = participants.find((p) => p.isHost);
  return !host || !isParticipantActive(host, now);
}
