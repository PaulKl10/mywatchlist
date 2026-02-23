"use client";

import { useState } from "react";
import Link from "next/link";
import { MovieCard } from "@/components/MovieCard";
import { PageFilter } from "@/components/PageFilter";
import { useGetWatchlistQuery } from "@/features/Watchlist/hooks/useGetWatchlistQuery";

export function WatchlistView() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useGetWatchlistQuery(page);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-2/3 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-zinc-600 dark:text-zinc-400">
          {error instanceof Error
            ? error.message
            : "Impossible de charger la watchlist"}
        </p>
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600"
        >
          Retour
        </Link>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="sticky top-0 z-10 flex gap-4 items-center justify-between bg-zinc-50 dark:bg-zinc-950 py-2 px-4">
        <h2 className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
          Ma watchlist ({data.total_results} film
          {data.total_results > 1 ? "s" : ""})
        </h2>
        <PageFilter
          currentPage={data.page}
          totalPages={data.total_pages}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      </div>
      {data.results.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">
            Votre watchlist est vide. Ajoutez des films depuis la page de
            détails !
          </p>
          <Link
            href="/"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            Découvrir des films
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 px-4 md:px-32">
          {data.results.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
