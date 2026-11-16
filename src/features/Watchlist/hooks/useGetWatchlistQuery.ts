import WatchlistService, {
  type TAvailableWatchlistResponse,
} from "@/features/Watchlist/services/watchlist.service";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { TMediaType } from "@/types/movie.type";

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

/**
 * Clé hors de ["watchlist"] : chaque vérification lit TMDB titre par titre, elle ne doit pas
 * repartir à chaque ajout, retrait ou note (voir `removeFromAvailableWatchlist`).
 */
export const AVAILABLE_WATCHLIST_KEY = ["watchlist-availability"] as const;

/** Médias de ma watchlist dispo sur mes plateformes, gardés 30 min. */
export const useAvailableWatchlistQuery = (mediaType: TMediaType, enabled: boolean) => {
  return useQuery({
    queryKey: [...AVAILABLE_WATCHLIST_KEY, mediaType],
    queryFn: () => WatchlistService.fetchAvailableWatchlist(mediaType),
    enabled,
    staleTime: 30 * 60 * 1000,
  });
};

/** Enregistre « mes plateformes » puis relance le filtre et le pré-remplissage de « Ce soir ? ». */
export const useSaveMyStreamingProvidersMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: WatchlistService.saveMyStreamingProviders,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AVAILABLE_WATCHLIST_KEY });
      queryClient.invalidateQueries({ queryKey: ["movie-night", "my-providers"] });
    },
  });
};

/** Retire un média sorti de la watchlist (retrait ou note) du filtre, sans relire TMDB. */
export function removeFromAvailableWatchlist(
  queryClient: QueryClient,
  mediaType: TMediaType,
  mediaId: number
): void {
  queryClient.setQueryData<TAvailableWatchlistResponse>(
    [...AVAILABLE_WATCHLIST_KEY, mediaType],
    (old) => old && { ...old, items: old.items.filter((item) => item.id !== mediaId) }
  );
}
