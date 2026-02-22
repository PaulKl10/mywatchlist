"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { MovieCard } from "@/components/MovieCard";
import {
  DEFAULT_FILTER_VALUES,
  DiscoverFilters,
} from "@/features/DiscoverMovies/components/DiscoverFilters";
import { PageFilter } from "@/components/PageFilter";
import { useGetDiscoverMoviesQuery } from "@/features/DiscoverMovies/hooks/useGetDiscoverMoviesQuery";
import type {
  TDiscoverFiltersForm,
  TDiscoverMoviesParams,
} from "@/features/DiscoverMovies/types/discover-movies.type";

function formValuesToParams(
  formValues: TDiscoverFiltersForm,
): Partial<TDiscoverMoviesParams> {
  const params: Partial<TDiscoverMoviesParams> = {
    sort_by: formValues.sort_by,
  };
  if (formValues.year && !Number.isNaN(Number(formValues.year))) {
    params.year = Number(formValues.year);
  }
  if (formValues.with_genres?.length > 0) {
    params.with_genres = formValues.with_genres.join(",");
  }
  if (
    formValues.vote_average_gte &&
    !Number.isNaN(Number(formValues.vote_average_gte))
  ) {
    params["vote_average.gte"] = Number(formValues.vote_average_gte);
  }
  return params;
}

export function DiscoverMoviesView() {
  const [page, setPage] = useState(1);
  const { register, watch, setValue, reset } = useForm<TDiscoverFiltersForm>({
    defaultValues: DEFAULT_FILTER_VALUES,
  });

  const formValues = watch();
  const filterParams = formValuesToParams(formValues);

  const { data, isLoading, isError, error } = useGetDiscoverMoviesQuery({
    ...filterParams,
    page,
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      <div className="sticky top-0 z-10 flex justify-between gap-8 border-b border-zinc-200 bg-zinc-50 py-4 dark:border-zinc-800 dark:bg-zinc-950 px-4 md:px-32">
        <div className="flex-1">
          <DiscoverFilters
            register={register}
            watch={watch}
            setValue={setValue}
            reset={reset}
          />
        </div>
        <PageFilter
          currentPage={data?.page ?? 1}
          totalPages={data?.total_pages ?? 1}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 px-4 md:px-32">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-2/3 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
            />
          ))
        ) : data ? (
          data.results.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))
        ) : null}
      </div>
    </div>
  );
}
