import axios from "axios";
import type { TTvDetails } from "@/types/movie.type";

const TvDetailsService = {
  fetchTvDetails: async (tvId: number): Promise<TTvDetails> => {
    const { data } = await axios.get<TTvDetails>(`/api/tv/${tvId}`);
    return data;
  },
};

export default TvDetailsService;
