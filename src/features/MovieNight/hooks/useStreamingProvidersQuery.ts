import { useQuery } from "@tanstack/react-query";
import {
  fetchMyStreamingProviderIds,
  fetchStreamingProviders,
} from "../services/movie-night.service";

export function useStreamingProvidersQuery(enabled = true) {
  return useQuery({
    queryKey: ["movie-night", "providers"],
    queryFn: fetchStreamingProviders,
    staleTime: 24 * 60 * 60 * 1000,
    enabled,
  });
}

export function useMyStreamingProviderIdsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["movie-night", "my-providers"],
    queryFn: fetchMyStreamingProviderIds,
    enabled,
  });
}
