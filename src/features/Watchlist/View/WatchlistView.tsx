"use client";

import { useState } from "react";
import Link from "next/link";
import { Film, Tv } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { PageFilter } from "@/components/PageFilter";
import { WatchlistTvCard } from "@/features/Watchlist/components/WatchlistTvCard";
import {
  useGetWatchlistMoviesQuery,
  useGetWatchlistTvQuery,
} from "@/features/Watchlist/hooks/useGetWatchlistQuery";

type MediaFilter = "movie" | "tv";

export function WatchlistView() {
  const [page, setPage] = useState(1);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("movie");

  const moviesQuery = useGetWatchlistMoviesQuery(page);
  const tvQuery = useGetWatchlistTvQuery(page);

  const moviesData = moviesQuery.data;
  const tvData = tvQuery.data;
  const { data, isLoading, isError, error } =
    mediaFilter === "movie" ? moviesQuery : tvQuery;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterChange = (filter: MediaFilter) => {
    setMediaFilter(filter);
    setPage(1);
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

  const emptyMessage =
    mediaFilter === "movie"
      ? "Votre watchlist films est vide. Ajoutez des films depuis la page de détails !"
      : "Votre watchlist séries est vide. Ajoutez des séries depuis la page de détails !";

  const emptyCta =
    mediaFilter === "movie" ? "Découvrir des films" : "Découvrir des séries";

  const countLabel =
    mediaFilter === "movie"
      ? `${data.total_results} film${data.total_results > 1 ? "s" : ""}`
      : `${data.total_results} série${data.total_results > 1 ? "s" : ""}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="sticky top-16 z-10 flex flex-col gap-4 bg-zinc-50 pt-5 pb-3 dark:bg-zinc-950 px-4 md:px-32">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
            Ma watchlist ({countLabel})
          </h2>
          <div className="flex items-center justify-between gap-4">
            <div className="flex rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => handleFilterChange("movie")}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  mediaFilter === "movie"
                    ? "bg-amber-500 text-white dark:bg-amber-600"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <Film className="h-4 w-4" />
                Films
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange("tv")}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  mediaFilter === "tv"
                    ? "bg-amber-500 text-white dark:bg-amber-600"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <Tv className="h-4 w-4" />
                Séries
              </button>
            </div>
            <div className="flex justify-end">
              <PageFilter
                currentPage={data.page}
                totalPages={data.total_pages}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
      {data.results.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">{emptyMessage}</p>
          <Link
            href="/"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            {emptyCta}
          </Link>
        </div>
      ) : mediaFilter === "movie" && moviesData ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 px-4 md:px-32">
          {moviesData.results.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : tvData ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 px-4 md:px-32">
          {tvData.results.map((tv) => (
            <WatchlistTvCard key={tv.id} tv={tv} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
