import { useMutation, useQueryClient } from "@tanstack/react-query";
import WatchlistService from "@/features/Watchlist/services/watchlist.service";

export const useAddToWatchlistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mediaId,
      mediaType = "movie",
    }: {
      mediaId: number;
      mediaType?: "movie" | "tv";
    }) => WatchlistService.addToWatchlist(mediaId, mediaType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
};

export const useRemoveFromWatchlistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mediaId,
      mediaType = "movie",
    }: {
      mediaId: number;
      mediaType?: "movie" | "tv";
    }) => WatchlistService.removeFromWatchlist(mediaId, mediaType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
};
