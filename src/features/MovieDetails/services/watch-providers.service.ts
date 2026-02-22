import axios from "axios";
import type { TWatchProviders } from "@/types/movie.type";

const WatchProvidersService = {
  fetchWatchProviders: async (
    movieId: number,
    country = "FR"
  ): Promise<TWatchProviders> => {
    const { data } = await axios.get<TWatchProviders>(
      `/api/movies/${movieId}/watch-providers`,
      { params: { country } }
    );
    return data;
  },
};

export default WatchProvidersService;
