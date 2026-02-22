import WatchlistService from "@/features/Watchlist/services/watchlist.service";
import { useQuery } from "@tanstack/react-query";

export const useGetWatchlistQuery = (page = 1) => {
  return useQuery({
    queryKey: ["watchlist", page],
    queryFn: () => WatchlistService.fetchWatchlist(page),
    enabled: page > 0,
  });
};
