"use client";

import { useState } from "react";
import { MovieCard } from "@/components/MovieCard";
import { PageFilter } from "@/components/PageFilter";
import { useGetDiscoverMoviesQuery } from "@/features/DiscoverMovies/hooks/useGetDiscoverMoviesQuery";

export function DiscoverMoviesView() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useGetDiscoverMoviesQuery({
    page,
    sort_by: "popularity.desc",
  });

  if (isLoading) {
    return (
      <>
        <div className="mb-6 flex flex-col gap-4">
          <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-2/3 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Erreur
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {error instanceof Error
            ? error.message
            : "Impossible de charger les films"}
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4">
        <PageFilter
          currentPage={data.page}
          totalPages={data.total_pages}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {data.results.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </>
  );
}
