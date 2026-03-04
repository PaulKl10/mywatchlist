import { useQuery } from "@tanstack/react-query";
import type { TDiscoverMoviesResponse } from "@/types/movie.type";

async function fetchPopularMovies(): Promise<TDiscoverMoviesResponse> {
  const res = await fetch(
    "/api/discover?sort_by=popularity.desc&page=1&language=fr-FR"
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch");
  return data;
}

export function usePopularMoviesQuery(enabled = true) {
  return useQuery({
    queryKey: ["home", "popular-movies"],
    queryFn: fetchPopularMovies,
    enabled,
  });
}
