"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { TvCard } from "@/components/TvCard";
import type { TMovie, TDiscoverTv } from "@/types/movie.type";
import { DiscoverFilters } from "@/features/DiscoverMovies/components/DiscoverFilters";
import { PageFilter } from "@/components/PageFilter";
import { useDiscoverFilters } from "@/features/DiscoverMovies/hooks/useDiscoverFilters";
import { useDiscoverStatePersistence } from "@/features/DiscoverMovies/hooks/useDiscoverStatePersistence";
import { useGetDiscoverMoviesQuery } from "@/features/DiscoverMovies/hooks/useGetDiscoverMoviesQuery";
import { useGetDiscoverTvQuery } from "@/features/DiscoverMovies/hooks/useGetDiscoverTvQuery";

export function DiscoverMoviesView() {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const searchParams = useSearchParams();
  const mediaTypeFromUrl = searchParams.get("media_type") as "movie" | "tv" | null;
  const effectiveMediaType = mediaTypeFromUrl === "tv" ? "tv" : "movie";

  const { register, watch, setValue, reset, formValues, filterParams } =
    useDiscoverFilters(effectiveMediaType);
  const { page, setPage, handleFiltersReset } = useDiscoverStatePersistence(
    formValues,
    reset,
  );

  useEffect(() => {
    const withGenres = searchParams.get("with_genres");
    if (withGenres) {
      const ids = withGenres
        .split(",")
        .map((s: string) => parseInt(s.trim(), 10))
        .filter((n: number) => !Number.isNaN(n));
      if (ids.length > 0) {
        setValue("with_genres", ids);
      }
    }
  }, [searchParams, setValue]);

  useEffect(() => {
    if (effectiveMediaType === "tv") {
      setValue("media_type", "tv");
    }
  }, [effectiveMediaType, setValue]);

  const isMovies = filterParams.media_type === "movie";

  const moviesQuery = useGetDiscoverMoviesQuery(
    { ...filterParams.movieParams, page },
    isMovies
  );
  const tvQuery = useGetDiscoverTvQuery(
    { ...filterParams.tvParams, page },
    !isMovies
  );

  const { data, isLoading, isError, error } = isMovies ? moviesQuery : tvQuery;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleMediaTypeChange = () => {
    setPage(1);
  };

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

  return (
    <div className="flex flex-col gap-5">
      <div className="sticky top-16 z-10 flex flex-col gap-4 border-b border-zinc-200 bg-zinc-50 pt-5 pb-3 dark:border-zinc-800 dark:bg-zinc-950 px-4 md:px-32">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 md:hidden dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Filter className="h-4 w-4" />
            Filtres
          </button>
          <div className="hidden flex-1 md:block">
            <DiscoverFilters
              register={register}
              watch={watch}
              setValue={setValue}
              reset={reset}
              onReset={handleFiltersReset}
              onMediaTypeChange={handleMediaTypeChange}
            />
          </div>
          <PageFilter
            currentPage={data?.page ?? 1}
            totalPages={data?.total_pages ?? 1}
            onPageChange={handlePageChange}
            isLoading={isLoading}
          />
        </div>
        {isFiltersOpen && (
          <div className="flex flex-col gap-3 md:hidden">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Filtres
              </span>
              <button
                type="button"
                onClick={() => setIsFiltersOpen(false)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Fermer les filtres"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <DiscoverFilters
              register={register}
              watch={watch}
              setValue={setValue}
              reset={reset}
              onReset={handleFiltersReset}
              onMediaTypeChange={handleMediaTypeChange}
            />
          </div>
        )}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 px-4 md:px-32">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="aspect-2/3 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
              />
            ))
          : data
            ? isMovies
              ? (data as { results: TMovie[] }).results.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))
              : (data as { results: TDiscoverTv[] }).results.map((tv) => (
                  <TvCard key={tv.id} tv={tv} />
                ))
            : null}
      </div>
    </div>
  );
}
