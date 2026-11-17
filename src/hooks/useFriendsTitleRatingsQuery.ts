import { useQuery } from "@tanstack/react-query";
import type { TMediaType } from "@/types/movie.type";
import type { TFriendTitleRating } from "@/types/rating.type";

async function fetchFriendsTitleRatings(
  mediaType: TMediaType,
  tmdbId: number
): Promise<TFriendTitleRating[]> {
  const params = new URLSearchParams({ media_type: mediaType, tmdb_id: String(tmdbId) });
  const res = await fetch(`/api/friends/ratings?${params}`, { credentials: "include" });
  if (!res.ok) throw new Error(`GET /api/friends/ratings failed with status ${res.status}`);
  const data: { items?: TFriendTitleRating[] } = await res.json();
  return data.items ?? [];
}

/** Notes des amis sur un film ou une série (compte connecté). */
export function useFriendsTitleRatingsQuery(
  tmdbId: number,
  mediaType: TMediaType,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["friends", "ratings", mediaType, tmdbId],
    queryFn: () => fetchFriendsTitleRatings(mediaType, tmdbId),
    enabled: enabled && tmdbId > 0,
  });
}
