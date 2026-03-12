import TvDetailsService from "@/features/TvDetails/services/tv-details.service";
import { useQuery } from "@tanstack/react-query";

export const useGetTvDetailsQuery = (tvId: number) => {
  return useQuery({
    queryKey: ["tv", "details", tvId],
    queryFn: () => TvDetailsService.fetchTvDetails(tvId),
    enabled: tvId > 0,
  });
};
