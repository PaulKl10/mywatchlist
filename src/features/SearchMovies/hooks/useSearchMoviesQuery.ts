import SearchMoviesService from "@/features/SearchMovies/services/search-movies.service";
import { useQuery } from "@tanstack/react-query";

export const useSearchMoviesQuery = (query: string, page = 1) => {
  return useQuery({
    queryKey: ["search", "movies", query, page],
    queryFn: () => SearchMoviesService.searchMovies(query, page),
    enabled: query.trim().length > 0,
  });
};
