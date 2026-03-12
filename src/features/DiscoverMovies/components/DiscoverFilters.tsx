"use client";

import { Film, Tv } from "lucide-react";
import { TMDB_MOVIE_GENRES } from "@/features/DiscoverMovies/constants/genres";
import { TMDB_TV_GENRES } from "@/features/DiscoverMovies/constants/tv-genres";
import { SORT_OPTIONS } from "@/features/DiscoverMovies/constants/sort-options";
import { SORT_OPTIONS_TV } from "@/features/DiscoverMovies/constants/sort-options-tv";
import type { UseFormRegister, UseFormReset, UseFormSetValue, UseFormWatch } from "react-hook-form";
import type { TDiscoverFiltersForm, TDiscoverMediaType } from "@/features/DiscoverMovies/types/discover-movies.type";

export const DEFAULT_FILTER_VALUES: TDiscoverFiltersForm = {
  media_type: "movie",
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
  onMediaTypeChange?: (mediaType: TDiscoverMediaType) => void;
}

export function DiscoverFilters({
  register,
  watch,
  setValue,
  reset,
  onReset,
  onMediaTypeChange,
}: DiscoverFiltersProps) {
  const formValues = watch();
  const mediaType = formValues.media_type ?? "movie";
  const genres = mediaType === "tv" ? TMDB_TV_GENRES : TMDB_MOVIE_GENRES;
  const sortOptions = mediaType === "tv" ? SORT_OPTIONS_TV : SORT_OPTIONS;

  const handleMediaTypeChange = (type: TDiscoverMediaType) => {
    setValue("media_type", type);
    setValue("with_genres", []);
    setValue(
      "sort_by",
      type === "tv" ? "popularity.desc" : "popularity.desc"
    );
    onMediaTypeChange?.(type);
  };

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
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Type
          </span>
          <div className="flex rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => handleMediaTypeChange("movie")}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mediaType === "movie"
                  ? "bg-amber-500 text-white dark:bg-amber-600"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <Film className="h-4 w-4" />
              Films
            </button>
            <button
              type="button"
              onClick={() => handleMediaTypeChange("tv")}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mediaType === "tv"
                  ? "bg-amber-500 text-white dark:bg-amber-600"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <Tv className="h-4 w-4" />
              Séries
            </button>
          </div>
        </div>
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
            {sortOptions.map((opt: (typeof sortOptions)[number]) => (
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
          {genres.map((genre: (typeof genres)[number]) => (
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
