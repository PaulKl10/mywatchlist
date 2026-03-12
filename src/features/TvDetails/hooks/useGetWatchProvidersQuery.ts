import WatchProvidersService from "@/features/TvDetails/services/watch-providers.service";
import { useQuery } from "@tanstack/react-query";

export const useGetWatchProvidersQuery = (
  tvId: number,
  country = "FR"
) => {
  return useQuery({
    queryKey: ["tv", "watch-providers", tvId, country],
    queryFn: () => WatchProvidersService.fetchWatchProviders(tvId, country),
    enabled: tvId > 0,
  });
};
