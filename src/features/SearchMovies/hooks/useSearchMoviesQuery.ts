import SearchMoviesService from "@/features/SearchMovies/services/search-movies.service";
import { useQuery } from "@tanstack/react-query";

export const useSearchMultiQuery = (query: string, page = 1) => {
  return useQuery({
    queryKey: ["search", "multi", query, page],
    queryFn: () => SearchMoviesService.searchMulti(query, page),
    enabled: query.trim().length > 0,
  });
};
