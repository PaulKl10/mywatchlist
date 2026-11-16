"use client";

import { MovieRow } from "./MovieRow";
import { TvRow } from "./TvRow";
import { useRecommendationsQuery } from "../hooks/useRecommendationsQuery";

/** Rangées « Parce que tu as aimé X ». Rien n'est affiché sans titre bien noté, ni en cas d'erreur. */
export function RecommendationRows() {
  const { data, isPending } = useRecommendationsQuery(true);

  if (isPending) {
    return <MovieRow title="Parce que tu as aimé…" movies={[]} isLoading />;
  }

  return (data ?? []).map((row) => {
    const title = `Parce que tu as aimé ${row.seedTitle}`;
    const key = `${row.mediaType}-${row.seedId}`;
    return row.mediaType === "tv" ? (
      <TvRow key={key} title={title} tvShows={row.tvShows} />
    ) : (
      <MovieRow key={key} title={title} movies={row.movies} />
    );
  });
}
