"use client";

import { useState } from "react";
import Link from "next/link";
import { PageFilter } from "@/components/PageFilter";
import { RatedMovieCard } from "@/features/RatedMedias/components/RatedMovieCard";
import { RatedTvCard } from "@/features/RatedMedias/components/RatedTvCard";
import {
  useGetRatedMoviesQuery,
  useGetRatedTvQuery,
} from "@/features/RatedMedias/hooks/useGetRatedMediasQuery";
import { Film, Star, Tv } from "lucide-react";

type MediaFilter = "movie" | "tv";

const GRID_CLASSES =
  "grid grid-cols-2 gap-4 px-4 sm:grid-cols-3 md:grid-cols-4 md:px-32 lg:grid-cols-5";

const BLOCK = "animate-pulse rounded bg-zinc-200 dark:bg-zinc-800";

/** Calqué sur `RatedMovieCard` / `RatedTvCard` : poster + titre, année, note. */
function RatedCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="aspect-2/3 w-full animate-pulse bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex flex-col p-3">
        <div className={`h-6 w-3/4 ${BLOCK}`} />
        <div className={`mt-1 h-5 w-12 ${BLOCK}`} />
        <div className={`mt-2 h-5 w-16 ${BLOCK}`} />
      </div>
    </div>
  );
}

export function RatedMediasView() {
  const [page, setPage] = useState(1);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("movie");

  const moviesQuery = useGetRatedMoviesQuery(page);
  const tvQuery = useGetRatedTvQuery(page);

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

  if (isError) {
    const isUnauthorized =
      error &&
      typeof error === "object" &&
      "response" in error &&
      (error as { response?: { status?: number } }).response?.status === 401;

    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-zinc-600 dark:text-zinc-400">
          {isUnauthorized
            ? "Connectez-vous pour voir vos notes."
            : error instanceof Error
              ? error.message
              : "Impossible de charger les notes"}
        </p>
        <div className="flex gap-3">
          {isUnauthorized ? (
            <Link
              href="/login"
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
            >
              Se connecter
            </Link>
          ) : null}
          <Link
            href="/"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600"
          >
            Retour
          </Link>
        </div>
      </div>
    );
  }

  const emptyMessage =
    mediaFilter === "movie"
      ? "Vous n'avez pas encore noté de film. Notez des films depuis la page de détails !"
      : "Vous n'avez pas encore noté de série. Notez des séries depuis la page de détails !";

  const emptyCta =
    mediaFilter === "movie" ? "Découvrir des films" : "Découvrir des séries";

  const renderResults = () => {
    if (isLoading) {
      return (
        <div className={GRID_CLASSES} aria-busy="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <RatedCardSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (!data) return null;

    if (data.results.length === 0) {
      return (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">{emptyMessage}</p>
          <Link
            href="/"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            {emptyCta}
          </Link>
        </div>
      );
    }

    if (mediaFilter === "movie" && moviesData) {
      return (
        <div className={GRID_CLASSES}>
          {moviesData.results.map((movie) => (
            <RatedMovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      );
    }

    if (tvData) {
      return (
        <div className={GRID_CLASSES}>
          {tvData.results.map((tv) => (
            <RatedTvCard key={tv.id} tv={tv} />
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="sticky top-16 z-10 flex flex-col gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950 md:px-32">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-lg font-medium text-zinc-700 dark:text-zinc-300">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            Mes notes{" "}
            {data ? (
              `(${data.total_results})`
            ) : (
              <span aria-hidden className={`inline-block h-4 w-8 ${BLOCK}`} />
            )}
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
                currentPage={data?.page ?? page}
                totalPages={data?.total_pages}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
      {renderResults()}
    </div>
  );
}
