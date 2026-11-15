import type {
  TDeckMovie,
  TMovieNightDecision,
  TMovieNightErrorCode,
  TMovieNightInvite,
  TMovieNightSettings,
  TMovieNightState,
  TStreamingProvider,
} from "@/lib/movie-night/types";
import type { TCreateMovieNightInput } from "@/lib/movie-night/validation";

/** Corps de `POST /api/movie-night/solo` ; `excludedMovieIds` pour une « Nouvelle pile ». */
export type TSoloDeckRequest = TMovieNightSettings & { excludedMovieIds?: number[] };

export type TMovieNightApiErrorCode = TMovieNightErrorCode | "tmdb_error" | "network";

export class MovieNightApiError extends Error {
  code: TMovieNightApiErrorCode;
  status: number;

  constructor(code: TMovieNightApiErrorCode, message: string, status: number) {
    super(message);
    this.name = "MovieNightApiError";
    this.code = code;
    this.status = status;
  }
}

async function request<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      credentials: "include",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new MovieNightApiError("network", "Connexion impossible. Réessayez.", 0);
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = (data ?? {}) as { error?: TMovieNightApiErrorCode; message?: string };
    throw new MovieNightApiError(
      err.error ?? "network",
      err.message ?? "Une erreur est survenue.",
      res.status,
    );
  }
  return data as T;
}

const base = "/api/movie-night";

export function createMovieNight(input: TCreateMovieNightInput): Promise<{ id: string }> {
  return request(base, "POST", input);
}

/** Pile d'une partie solo : aucune session créée, la partie se joue dans le navigateur. */
export function fetchSoloDeck(input: TSoloDeckRequest): Promise<{ deck: TDeckMovie[] }> {
  return request(`${base}/solo`, "POST", input);
}

export function joinMovieNight(code: string, guestName?: string): Promise<{ id: string }> {
  return request(`${base}/join`, "POST", { code, guestName });
}

export function fetchMovieNightState(id: string): Promise<TMovieNightState> {
  return request(`${base}/${id}`);
}

export function startMovieNight(id: string): Promise<TMovieNightState> {
  return request(`${base}/${id}/start`, "POST");
}

export function castVote(
  id: string,
  vote: { movieId: number; liked: boolean },
): Promise<TMovieNightState> {
  return request(`${base}/${id}/votes`, "POST", vote);
}

export function decide(id: string, decision: TMovieNightDecision): Promise<TMovieNightState> {
  return request(`${base}/${id}/decision`, "POST", decision);
}

export function startNewRound(id: string): Promise<TMovieNightState> {
  return request(`${base}/${id}/rounds`, "POST");
}

export async function leaveMovieNight(id: string): Promise<void> {
  await request<unknown>(`${base}/${id}/leave`, "POST");
}

export function removeParticipant(id: string, participantId: string): Promise<TMovieNightState> {
  return request(`${base}/${id}/participants/${participantId}`, "DELETE");
}

export async function inviteFriend(id: string, friendUserId: string): Promise<void> {
  await request<unknown>(`${base}/${id}/invites`, "POST", { friendUserId });
}

export function respondToInvite(id: string, accept: boolean): Promise<{ id: string }> {
  return request(`${base}/${id}/invites/respond`, "POST", { accept });
}

export async function fetchInvites(): Promise<TMovieNightInvite[]> {
  const data = await request<{ invites: TMovieNightInvite[] }>(`${base}/invites`);
  return data.invites ?? [];
}

export function fetchStreamingProviders(): Promise<TStreamingProvider[]> {
  return request("/api/watch-providers");
}

export async function fetchMyStreamingProviderIds(): Promise<number[]> {
  const data = await request<{ providerIds: number[] }>("/api/me/streaming-providers");
  return data.providerIds ?? [];
}
