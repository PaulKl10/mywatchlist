import { useQuery } from "@tanstack/react-query";
import type { TRecommendationRow } from "@/types/recommendation.type";

/** Les rangées gardent leurs titres tirés au hasard le temps de naviguer dans l'app. */
const STALE_TIME_MS = 10 * 60 * 1000;

async function fetchRecommendations(): Promise<TRecommendationRow[]> {
  const res = await fetch("/api/recommendations", { credentials: "include" });
  if (!res.ok) {
    throw new Error(`GET /api/recommendations failed with status ${res.status}`);
  }
  const data: { rows: TRecommendationRow[] } = await res.json();
  return data.rows;
}

export function useRecommendationsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["home", "recommendations"],
    queryFn: fetchRecommendations,
    enabled,
    staleTime: STALE_TIME_MS,
    retry: 1,
  });
}
