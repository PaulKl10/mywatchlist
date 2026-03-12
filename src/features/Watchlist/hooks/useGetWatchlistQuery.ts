import WatchlistService from "@/features/Watchlist/services/watchlist.service";
import { useQuery } from "@tanstack/react-query";

export const useGetWatchlistMoviesQuery = (page = 1) => {
  return useQuery({
    queryKey: ["watchlist", "movie", page],
    queryFn: () => WatchlistService.fetchWatchlistMovies(page),
    enabled: page > 0,
  });
};

export const useGetWatchlistTvQuery = (page = 1) => {
  return useQuery({
    queryKey: ["watchlist", "tv", page],
    queryFn: () => WatchlistService.fetchWatchlistTv(page),
    enabled: page > 0,
  });
};

export const useGetMyWatchlistFromDbQuery = () => {
  return useQuery({
    queryKey: ["watchlist", "me", "from-db"],
    queryFn: () => WatchlistService.fetchMyWatchlistFromDb(),
  });
};
