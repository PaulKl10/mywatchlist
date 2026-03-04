import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TAccountStates } from "@/hooks/useAccountStatesQuery";
import RatingService from "@/features/RatedMovies/services/rating.service";

export const useAddRatingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ movieId, value }: { movieId: number; value: number }) =>
      RatingService.addRating(movieId, value),
    onMutate: async ({ movieId, value }) => {
      const queryKey = ["account-states", movieId] as const;
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<TAccountStates>(queryKey);
      queryClient.setQueryData<TAccountStates>(queryKey, (old) => ({
        ...(old ?? { watchlist: false, favorite: false, rated: false }),
        rated: { value },
      }));

      return { previous };
    },
    onError: (_err, { movieId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["account-states", movieId],
          context.previous
        );
      }
    },
    onSettled: (_, __, { movieId }) => {
      // Ne pas invalider account-states : TMDB peut renvoyer des données pas encore à jour
      // et écraser notre mise à jour optimiste. On garde le cache tel quel.
      queryClient.invalidateQueries({ queryKey: ["rated-movies"] });
    },
  });
};

export const useRemoveRatingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movieId: number) => RatingService.removeRating(movieId),
    onMutate: async (movieId) => {
      const queryKey = ["account-states", movieId] as const;
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<TAccountStates>(queryKey);
      queryClient.setQueryData<TAccountStates>(queryKey, (old) => ({
        ...(old ?? { watchlist: false, favorite: false, rated: false }),
        rated: false,
      }));

      return { previous };
    },
    onError: (_err, movieId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["account-states", movieId],
          context.previous
        );
      }
    },
    onSettled: () => {
      // Ne pas invalider account-states : TMDB peut renvoyer des données pas encore à jour
      queryClient.invalidateQueries({ queryKey: ["rated-movies"] });
    },
  });
};
