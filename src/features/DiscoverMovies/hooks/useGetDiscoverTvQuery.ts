import DiscoverTvService from "@/features/DiscoverMovies/services/discover-tv.service";
import type { TDiscoverTvParams } from "@/features/DiscoverMovies/services/discover-tv.service";
import { useQuery } from "@tanstack/react-query";

export const useGetDiscoverTvQuery = (
  params: TDiscoverTvParams = {},
  enabled = true
) => {
  const page = params.page ?? 1;
  return useQuery({
    queryKey: ["discover", "tv", params],
    queryFn: () => DiscoverTvService.fetchDiscoverTv(params),
    enabled: enabled && page > 0,
  });
};
