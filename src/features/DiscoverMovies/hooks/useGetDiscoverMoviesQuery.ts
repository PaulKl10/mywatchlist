import MoviesService from "@/features/DiscoverMovies/services/discover-movies.service";
import type { TDiscoverMoviesParams } from "@/features/DiscoverMovies/types/discover-movies.type";
import { useQuery } from "@tanstack/react-query";

export const useGetDiscoverMoviesQuery = (
  params: TDiscoverMoviesParams = {},
  enabled = true
) => {
  const page = params.page ?? 1;
  return useQuery({
    queryKey: ["discover", "movies", params],
    queryFn: () => MoviesService.fetchDiscoverMovies(params),
    enabled: enabled && page > 0,
  });
};
