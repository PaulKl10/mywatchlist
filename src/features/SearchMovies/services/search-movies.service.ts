import axios from "axios";
import type { TMultiSearchResponse } from "@/types/search.type";

const SearchMoviesService = {
  searchMulti: async (
    query: string,
    page = 1
  ): Promise<TMultiSearchResponse> => {
    const { data } = await axios.get<TMultiSearchResponse>("/api/search", {
      params: { query, page },
    });
    return data;
  },
};

export default SearchMoviesService;
