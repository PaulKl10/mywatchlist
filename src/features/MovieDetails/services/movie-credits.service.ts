import axios from "axios";
import type { TMovieCredits } from "@/types/movie.type";

const MovieCreditsService = {
  fetchCredits: async (movieId: number): Promise<TMovieCredits> => {
    const { data } = await axios.get<TMovieCredits>(
      `/api/movies/${movieId}/credits`
    );
    return data;
  },
};

export default MovieCreditsService;
