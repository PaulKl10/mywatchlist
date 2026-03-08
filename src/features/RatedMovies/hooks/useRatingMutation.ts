import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TAccountStates } from "@/hooks/useAccountStatesQuery";
import RatingService from "@/features/RatedMovies/services/rating.service";

export const useAddRatingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      movieId,
      value,
      runtime,
    }: {
      movieId: number;
      value: number;
      runtime?: number | null;
    }) => RatingService.addRating(movieId, value, runtime),
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["rated-movies"] });
      queryClient.invalidateQueries({ queryKey: ["watch-time"] });
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
      queryClient.invalidateQueries({ queryKey: ["rated-movies"] });
      queryClient.invalidateQueries({ queryKey: ["watch-time"] });
    },
  });
};
