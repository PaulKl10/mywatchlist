import { useQuery } from "@tanstack/react-query";
import type { TDiscoverTvResponse } from "@/types/movie.type";

async function fetchPopularTv(): Promise<TDiscoverTvResponse> {
  const res = await fetch(
    "/api/discover/tv?sort_by=popularity.desc&page=1&language=fr-FR&vote_count.gte=100"
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch");
  return data;
}

export function usePopularTvQuery(enabled = true) {
  return useQuery({
    queryKey: ["home", "popular-tv"],
    queryFn: fetchPopularTv,
    enabled,
  });
}
