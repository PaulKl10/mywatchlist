import { useQuery } from "@tanstack/react-query";
import { POLL_INTERVAL_MS } from "@/lib/movie-night/constants";
import type { TMovieNightState } from "@/lib/movie-night/types";
import { fetchMovieNightState, MovieNightApiError } from "../services/movie-night.service";

export function isGone(error: unknown): boolean {
  return error instanceof MovieNightApiError && (error.status === 403 || error.status === 404);
}

export function useMovieNight(id: string) {
  return useQuery<TMovieNightState, MovieNightApiError>({
    queryKey: ["movie-night", id],
    queryFn: () => fetchMovieNightState(id),
    refetchInterval: (query) => {
      if (isGone(query.state.error)) return false;
      const status = query.state.data?.status;
      return status === "LOBBY" || status === "SWIPING" || status === "MATCH"
        ? POLL_INTERVAL_MS
        : false;
    },
    refetchIntervalInBackground: false,
    retry: (failureCount, error) => !isGone(error) && failureCount < 2,
  });
}
