import type { TMovieNightState } from "@/lib/movie-night/types";

/** « Léa », « Léa et Max », « Léa, Max et Zoé ». */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;
}

/** Nom de l'hôte s'il est actif, sinon null (le serveur décide qui peut trancher). */
export function activeHostName(state: TMovieNightState): string | null {
  const host = state.participants.find((p) => p.isHost);
  return host?.isActive ? host.name : null;
}

/** Participants actifs qui n'ont pas fini la pile. */
export function waitingNames(state: TMovieNightState): string[] {
  return state.participants.filter((p) => p.isActive && !p.hasFinished).map((p) => p.name);
}
