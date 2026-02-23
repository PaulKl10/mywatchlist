import MovieCreditsService from "@/features/MovieDetails/services/movie-credits.service";
import { useQuery } from "@tanstack/react-query";

export const useGetMovieCreditsQuery = (movieId: number) => {
  return useQuery({
    queryKey: ["movie", "credits", movieId],
    queryFn: () => MovieCreditsService.fetchCredits(movieId),
    enabled: movieId > 0,
  });
};
