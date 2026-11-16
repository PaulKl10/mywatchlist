import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TAccountStates } from "@/hooks/useAccountStatesQuery";
import RatingService from "@/features/RatedMedias/services/rating.service";
import { removeFromAvailableWatchlist } from "@/features/Watchlist/hooks/useGetWatchlistQuery";

export const useAddRatingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mediaId,
      value,
      mediaType = "movie",
    }: {
      mediaId: number;
      value: number;
      mediaType?: "movie" | "tv";
    }) => RatingService.addRating(mediaId, value, mediaType),
    onMutate: async ({ mediaId, value, mediaType = "movie" }) => {
      const queryKey = ["account-states", mediaType, mediaId] as const;
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<TAccountStates>(queryKey);
      // Un média noté sort de la watchlist (fait côté serveur).
      queryClient.setQueryData<TAccountStates>(queryKey, (old) => ({
        ...(old ?? { favorite: false }),
        watchlist: false,
        rated: { value },
      }));

      return { previous };
    },
    onError: (_err, { mediaId, mediaType = "movie" }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["account-states", mediaType, mediaId],
          context.previous
        );
      }
    },
    onSuccess: (_data, { mediaId, mediaType = "movie" }) => {
      removeFromAvailableWatchlist(queryClient, mediaType, mediaId);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["rated-movies"] });
      queryClient.invalidateQueries({ queryKey: ["watch-time"] });
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
};

export const useRemoveRatingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mediaId,
      mediaType = "movie",
    }: {
      mediaId: number;
      mediaType?: "movie" | "tv";
    }) => RatingService.removeRating(mediaId, mediaType),
    onMutate: async ({ mediaId, mediaType = "movie" }) => {
      const queryKey = ["account-states", mediaType, mediaId] as const;
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<TAccountStates>(queryKey);
      queryClient.setQueryData<TAccountStates>(queryKey, (old) => ({
        ...(old ?? { watchlist: false, favorite: false, rated: false }),
        rated: false,
      }));

      return { previous };
    },
    onError: (_err, { mediaId, mediaType = "movie" }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["account-states", mediaType, mediaId],
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
