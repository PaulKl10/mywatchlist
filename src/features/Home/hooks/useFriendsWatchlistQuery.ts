import { useQuery } from "@tanstack/react-query";
import type { TMovie } from "@/types/movie.type";

async function fetchFriendsWatchlist(): Promise<TMovie[]> {
  const res = await fetch("/api/friends/watchlist", { credentials: "include" });
  const data = await res.json();
  return data.movies ?? [];
}

export function useFriendsWatchlistQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["home", "friends-watchlist"],
    queryFn: fetchFriendsWatchlist,
    enabled,
  });
}
