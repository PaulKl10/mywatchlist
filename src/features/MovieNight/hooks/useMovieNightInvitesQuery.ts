import { useQuery } from "@tanstack/react-query";
import { fetchInvites } from "../services/movie-night.service";

export function useMovieNightInvitesQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["movie-night", "invites"],
    queryFn: fetchInvites,
    enabled,
  });
}
