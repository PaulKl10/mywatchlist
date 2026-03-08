import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { TWatchTimeResponse } from "@/app/api/watch-time/route";

const WatchTimeService = {
  fetchWatchTime: async (): Promise<TWatchTimeResponse> => {
    const { data } = await axios.get<TWatchTimeResponse>("/api/watch-time", {
      withCredentials: true,
    });
    return data;
  },

  fetchWatchTimeByUser: async (
    tmdbId: number
  ): Promise<TWatchTimeResponse> => {
    const { data } = await axios.get<TWatchTimeResponse>(
      `/api/users/${tmdbId}/watch-time`,
      { withCredentials: true }
    );
    return data;
  },
};

export const useWatchTimeQuery = () => {
  return useQuery({
    queryKey: ["watch-time"],
    queryFn: WatchTimeService.fetchWatchTime,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useWatchTimeByUserQuery = (tmdbId: number) => {
  return useQuery({
    queryKey: ["watch-time", "user", tmdbId],
    queryFn: () => WatchTimeService.fetchWatchTimeByUser(tmdbId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !Number.isNaN(tmdbId) && tmdbId > 0,
  });
};
