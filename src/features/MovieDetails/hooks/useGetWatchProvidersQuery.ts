import WatchProvidersService from "@/features/MovieDetails/services/watch-providers.service";
import { useQuery } from "@tanstack/react-query";

export const useGetWatchProvidersQuery = (
  movieId: number,
  country = "FR"
) => {
  return useQuery({
    queryKey: ["movie", "watch-providers", movieId, country],
    queryFn: () => WatchProvidersService.fetchWatchProviders(movieId, country),
    enabled: movieId > 0,
  });
};
