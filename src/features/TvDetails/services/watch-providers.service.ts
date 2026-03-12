import axios from "axios";
import type { TWatchProviders } from "@/types/movie.type";

const WatchProvidersService = {
  fetchWatchProviders: async (
    tvId: number,
    country = "FR"
  ): Promise<TWatchProviders> => {
    const { data } = await axios.get<TWatchProviders>(
      `/api/tv/${tvId}/watch-providers`,
      { params: { country } }
    );
    return data;
  },
};

export default WatchProvidersService;
