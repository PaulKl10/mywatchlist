import RatedMoviesService from "@/features/RatedMovies/services/rated-movies.service";
import { useQuery } from "@tanstack/react-query";

export const useGetRatedMoviesQuery = (page = 1) => {
  return useQuery({
    queryKey: ["rated-movies", page],
    queryFn: () => RatedMoviesService.fetchRatedMovies(page),
  });
};
