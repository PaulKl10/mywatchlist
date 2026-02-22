import { useMutation, useQueryClient } from "@tanstack/react-query";
import WatchlistService from "@/features/Watchlist/services/watchlist.service";

export const useAddToWatchlistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movieId: number) => WatchlistService.addToWatchlist(movieId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
};

export const useRemoveFromWatchlistMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movieId: number) =>
      WatchlistService.removeFromWatchlist(movieId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
};
