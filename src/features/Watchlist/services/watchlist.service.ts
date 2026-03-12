import axios from "axios";
import type {
  TDiscoverMoviesResponse,
  TWatchlistTvResponse,
} from "@/types/movie.type";

const WatchlistService = {
  fetchWatchlistMovies: async (
    page = 1
  ): Promise<TDiscoverMoviesResponse> => {
    const { data } = await axios.get<TDiscoverMoviesResponse>(
      "/api/watchlist",
      {
        params: { page, media_type: "movie" },
        withCredentials: true,
      }
    );
    return data;
  },

  fetchWatchlistTv: async (
    page = 1
  ): Promise<TWatchlistTvResponse> => {
    const { data } = await axios.get<TWatchlistTvResponse>(
      "/api/watchlist",
      {
        params: { page, media_type: "tv" },
        withCredentials: true,
      }
    );
    return data;
  },

  addToWatchlist: async (
    mediaId: number,
    mediaType: "movie" | "tv" = "movie"
  ): Promise<void> => {
    await axios.post(
      "/api/watchlist",
      { media_id: mediaId, watchlist: true, media_type: mediaType },
      { withCredentials: true }
    );
  },

  fetchMyWatchlistFromDb: async (): Promise<{
    items: Array<{
      id: number;
      media_type: "movie" | "tv";
      title: string;
      poster_path: string | null;
      release_date: string | null;
      vote_average: number | null;
      overview: string | null;
    }>;
    total: number;
  }> => {
    const { data } = await axios.get<{
      items: Array<{
        id: number;
        media_type: "movie" | "tv";
        title: string;
        poster_path: string | null;
        release_date: string | null;
        vote_average: number | null;
        overview: string | null;
      }>;
      total: number;
    }>("/api/me/watchlist", { withCredentials: true });
    return data;
  },

  removeFromWatchlist: async (
    mediaId: number,
    mediaType: "movie" | "tv" = "movie"
  ): Promise<void> => {
    await axios.post(
      "/api/watchlist",
      { media_id: mediaId, watchlist: false, media_type: mediaType },
      { withCredentials: true }
    );
  },
};

export default WatchlistService;
