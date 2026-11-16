import { useQuery } from "@tanstack/react-query";
import type { TFriendRating } from "@/types/rating.type";

/** null : notes non visibles (pas ami, ou utilisateur inconnu). */
async function fetchFriendRatings(tmdbId: number): Promise<TFriendRating[] | null> {
  const res = await fetch(`/api/users/${tmdbId}/ratings`, { credentials: "include" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET /api/users/${tmdbId}/ratings failed with status ${res.status}`);
  const data: { items: TFriendRating[] } = await res.json();
  return data.items;
}

export function useFriendRatingsQuery(tmdbId: number) {
  return useQuery({
    queryKey: ["users", tmdbId, "ratings"],
    queryFn: () => fetchFriendRatings(tmdbId),
    enabled: Number.isInteger(tmdbId) && tmdbId > 0,
  });
}
