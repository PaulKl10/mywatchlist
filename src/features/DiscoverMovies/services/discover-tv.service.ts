import axios from "axios";
import type { TDiscoverTvResponse } from "@/types/movie.type";

export type TDiscoverTvParams = {
  page?: number;
  language?: string;
  sort_by?: string;
  "vote_average.gte"?: number;
  "vote_average.lte"?: number;
  "vote_count.gte"?: number;
  "vote_count.lte"?: number;
  first_air_date_year?: number;
  with_genres?: string;
};

const DiscoverTvService = {
  fetchDiscoverTv: async (
    params: TDiscoverTvParams = {}
  ): Promise<TDiscoverTvResponse> => {
    const merged = { page: 1, ...params };
    const filtered = Object.fromEntries(
      Object.entries(merged).filter(
        ([, v]) => v !== undefined && v !== null && v !== ""
      )
    );
    const { data } = await axios.get<TDiscoverTvResponse>(
      "/api/discover/tv",
      { params: filtered }
    );
    return data;
  },
};

export default DiscoverTvService;
