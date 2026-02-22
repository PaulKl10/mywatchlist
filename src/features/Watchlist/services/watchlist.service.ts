import axios from "axios";
import type { TDiscoverMoviesResponse } from "@/types/movie.type";

const WatchlistService = {
  fetchWatchlist: async (
    page = 1
  ): Promise<TDiscoverMoviesResponse> => {
    const { data } = await axios.get<TDiscoverMoviesResponse>(
      "/api/watchlist",
      {
        params: { page },
        withCredentials: true,
      }
    );
    return data;
  },

  addToWatchlist: async (movieId: number): Promise<void> => {
    await axios.post(
      "/api/watchlist",
      { media_id: movieId, watchlist: true },
      { withCredentials: true }
    );
  },

  removeFromWatchlist: async (movieId: number): Promise<void> => {
    await axios.post(
      "/api/watchlist",
      { media_id: movieId, watchlist: false },
      { withCredentials: true }
    );
  },
};

export default WatchlistService;
