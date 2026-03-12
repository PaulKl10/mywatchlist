import axios from "axios";
import type { TMovieCredits } from "@/types/movie.type";

const CreditsService = {
  fetchCredits: async (tvId: number): Promise<TMovieCredits> => {
    const { data } = await axios.get<TMovieCredits>(
      `/api/tv/${tvId}/credits`
    );
    return data;
  },
};

export default CreditsService;
