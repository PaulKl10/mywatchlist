import { useQuery } from "@tanstack/react-query";
import type { TDiscoverMoviesResponse } from "@/types/movie.type";

async function fetchGenreMovies(
  genreId: number
): Promise<TDiscoverMoviesResponse> {
  const res = await fetch(
    `/api/discover?sort_by=popularity.desc&page=1&language=fr-FR&with_genres=${genreId}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch");
  return data;
}

export function useGenreMoviesQuery(genreId: number, enabled = true) {
  return useQuery({
    queryKey: ["home", "genre", genreId],
    queryFn: () => fetchGenreMovies(genreId),
    enabled: enabled && genreId > 0,
  });
}
