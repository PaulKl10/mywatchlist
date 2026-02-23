import axios from "axios";
import type {
  TPersonDetails,
  TPersonMovieCredits,
} from "@/types/movie.type";

const PersonService = {
  fetchPersonDetails: async (personId: number): Promise<TPersonDetails> => {
    const { data } = await axios.get<TPersonDetails>(
      `/api/person/${personId}`
    );
    return data;
  },

  fetchMovieCredits: async (
    personId: number
  ): Promise<TPersonMovieCredits> => {
    const { data } = await axios.get<TPersonMovieCredits>(
      `/api/person/${personId}/movie-credits`
    );
    return data;
  },
};

export default PersonService;
