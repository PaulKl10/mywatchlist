import CreditsService from "@/features/TvDetails/services/credits.service";
import { useQuery } from "@tanstack/react-query";

export const useGetCreditsQuery = (tvId: number) => {
  return useQuery({
    queryKey: ["tv", "credits", tvId],
    queryFn: () => CreditsService.fetchCredits(tvId),
    enabled: tvId > 0,
  });
};
