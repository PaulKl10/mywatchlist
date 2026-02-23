import axios from "axios";
import type { TRatedMovie } from "@/types/movie.type";

type TRatedMoviesResponse = {
  page: number;
  results: TRatedMovie[];
  total_pages: number;
  total_results: number;
};

const RatedMoviesService = {
  fetchRatedMovies: async (
    page = 1
  ): Promise<TRatedMoviesResponse> => {
    const { data } = await axios.get<TRatedMoviesResponse>(
      "/api/rated-movies",
      { params: { page }, withCredentials: true }
    );
    return data;
  },
};

export default RatedMoviesService;
