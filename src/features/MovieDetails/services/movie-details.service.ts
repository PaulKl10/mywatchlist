import axios from "axios";
import type { TMovieDetails } from "@/types/movie.type";

const MovieDetailsService = {
  fetchMovieDetails: async (movieId: number): Promise<TMovieDetails> => {
    const { data } = await axios.get<TMovieDetails>(`/api/movies/${movieId}`);
    return data;
  },
};

export default MovieDetailsService;
