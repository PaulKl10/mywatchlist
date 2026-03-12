import axios from "axios";
import type { TRatedMovie, TRatedTv } from "@/types/movie.type";

type TRatedResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

const RatedMediasService = {
  fetchRatedMovies: async (
    page = 1
  ): Promise<TRatedResponse<TRatedMovie>> => {
    const { data } = await axios.get<TRatedResponse<TRatedMovie>>(
      "/api/rated-movies",
      { params: { page, media_type: "movie" }, withCredentials: true }
    );
    return data;
  },

  fetchRatedTv: async (
    page = 1
  ): Promise<TRatedResponse<TRatedTv>> => {
    const { data } = await axios.get<TRatedResponse<TRatedTv>>(
      "/api/rated-movies",
      { params: { page, media_type: "tv" }, withCredentials: true }
    );
    return data;
  },
};

export default RatedMediasService;
