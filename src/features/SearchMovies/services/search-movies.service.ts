import axios from "axios";
import type { TDiscoverMoviesResponse } from "@/types/movie.type";

const SearchMoviesService = {
  searchMovies: async (
    query: string,
    page = 1
  ): Promise<TDiscoverMoviesResponse> => {
    const { data } = await axios.get<TDiscoverMoviesResponse>("/api/search", {
      params: { query, page },
    });
    return data;
  },
};

export default SearchMoviesService;
