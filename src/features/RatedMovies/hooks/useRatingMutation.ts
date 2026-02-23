import { useMutation, useQueryClient } from "@tanstack/react-query";
import RatingService from "@/features/RatedMovies/services/rating.service";

export const useAddRatingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ movieId, value }: { movieId: number; value: number }) =>
      RatingService.addRating(movieId, value),
    onSuccess: (_, { movieId }) => {
      queryClient.invalidateQueries({ queryKey: ["account-states", movieId] });
      queryClient.invalidateQueries({ queryKey: ["rated-movies"] });
    },
  });
};

export const useRemoveRatingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movieId: number) => RatingService.removeRating(movieId),
    onSuccess: (_, movieId) => {
      queryClient.invalidateQueries({ queryKey: ["account-states", movieId] });
      queryClient.invalidateQueries({ queryKey: ["rated-movies"] });
    },
  });
};
