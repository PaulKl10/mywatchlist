"use client";

import { TMDB_MOVIE_GENRES } from "@/features/DiscoverMovies/constants/genres";
import { SORT_OPTIONS } from "@/features/DiscoverMovies/constants/sort-options";
import type { UseFormRegister, UseFormReset, UseFormSetValue, UseFormWatch } from "react-hook-form";
import type { TDiscoverFiltersForm } from "@/features/DiscoverMovies/types/discover-movies.type";

export const DEFAULT_FILTER_VALUES: TDiscoverFiltersForm = {
  sort_by: "popularity.desc",
  year: "",
  with_genres: [],
  vote_average_gte: "",
};

interface DiscoverFiltersProps {
  register: UseFormRegister<TDiscoverFiltersForm>;
  watch: UseFormWatch<TDiscoverFiltersForm>;
  setValue: UseFormSetValue<TDiscoverFiltersForm>;
  reset: UseFormReset<TDiscoverFiltersForm>;
  onReset?: () => void;
}

export function DiscoverFilters({
  register,
  watch,
  setValue,
  reset,
  onReset,
}: DiscoverFiltersProps) {
  const formValues = watch();

  const toggleGenre = (genreId: number) => {
    const current = formValues.with_genres || [];
    const next = current.includes(genreId)
      ? current.filter((id) => id !== genreId)
      : [...current, genreId];
    setValue("with_genres", next);
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      reset(DEFAULT_FILTER_VALUES);
    }
  };

  return (
    <form className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="sort_by"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Tri
          </label>
          <select
            id="sort_by"
            {...register("sort_by")}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {SORT_OPTIONS.map((opt: (typeof SORT_OPTIONS)[number]) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="vote_average_gte"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Note min.
          </label>
          <input
            id="vote_average_gte"
            type="text"
            inputMode="decimal"
            placeholder="ex: 7"
            {...register("vote_average_gte")}
            className="w-20 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Genres
        </span>
        <div className="flex flex-wrap gap-2">
          {TMDB_MOVIE_GENRES.map((genre: (typeof TMDB_MOVIE_GENRES)[number]) => (
            <button
              key={genre.id}
              type="button"
              onClick={() => toggleGenre(genre.id)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                (formValues.with_genres || []).includes(genre.id)
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
