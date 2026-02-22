import MovieDetailsService from "@/features/MovieDetails/services/movie-details.service";
import { useQuery } from "@tanstack/react-query";

export const useGetMovieDetailsQuery = (movieId: number) => {
  return useQuery({
    queryKey: ["movie", "details", movieId],
    queryFn: () => MovieDetailsService.fetchMovieDetails(movieId),
    enabled: movieId > 0,
  });
};
