import axios from "axios";
import type { TDiscoverMoviesResponse } from "@/types/movie.type";
import type { TDiscoverMoviesParams } from "@/features/DiscoverMovies/types/discover-movies.type";

const DiscoverMoviesService = {
  fetchDiscoverMovies: async (
    params: TDiscoverMoviesParams = {},
  ): Promise<TDiscoverMoviesResponse> => {
    const merged = { page: 1, ...params };
    const filtered = Object.fromEntries(
      Object.entries(merged).filter(
        ([, v]) => v !== undefined && v !== null && v !== "",
      ),
    );
    const { data } = await axios.get<TDiscoverMoviesResponse>("/api/discover", {
      params: filtered,
    });
    return data;
  },
};

export default DiscoverMoviesService;
