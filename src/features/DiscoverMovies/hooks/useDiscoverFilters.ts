import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  DEFAULT_FILTER_VALUES,
} from "@/features/DiscoverMovies/components/DiscoverFilters";
import { getStoredDiscoverState } from "@/features/DiscoverMovies/utils/discover-storage";
import type {
  TDiscoverFiltersForm,
  TDiscoverMoviesParams,
} from "@/features/DiscoverMovies/types/discover-movies.type";
import { useDebounce } from "@/hooks/useDebounce";

export type TDiscoverFilterParams = {
  media_type: "movie" | "tv";
  movieParams: Partial<TDiscoverMoviesParams>;
  tvParams: {
    sort_by?: string;
    year?: number;
    first_air_date_year?: number;
    with_genres?: string;
    "vote_average.gte"?: number;
    "vote_count.gte"?: number;
  };
};

function formValuesToParams(
  formValues: TDiscoverFiltersForm
): TDiscoverFilterParams {
  const mediaType = formValues.media_type ?? "movie";
  const year = formValues.year && !Number.isNaN(Number(formValues.year))
    ? Number(formValues.year)
    : undefined;
  const voteAverageGte = formValues.vote_average_gte &&
    !Number.isNaN(Number(formValues.vote_average_gte))
    ? Number(formValues.vote_average_gte)
    : undefined;
  const withGenres = formValues.with_genres?.length > 0
    ? formValues.with_genres.join(",")
    : undefined;
  const needsVoteCount =
    formValues.sort_by === "vote_average.asc" ||
    formValues.sort_by === "vote_average.desc";

  const sortBy = formValues.sort_by ?? "popularity.desc";

  const movieSortMap: Record<string, TDiscoverMoviesParams["sort_by"]> = {
    "first_air_date.asc": "primary_release_date.asc",
    "first_air_date.desc": "primary_release_date.desc",
    "name.asc": "original_title.asc",
    "name.desc": "original_title.desc",
    "title.asc": "original_title.asc",
    "title.desc": "original_title.desc",
  };
  const movieSortBy =
    movieSortMap[sortBy] ?? (sortBy as TDiscoverMoviesParams["sort_by"]);

  const tvSortMap: Record<string, string> = {
    "primary_release_date.asc": "first_air_date.asc",
    "primary_release_date.desc": "first_air_date.desc",
    "title.asc": "name.asc",
    "title.desc": "name.desc",
  };
  const tvSortBy = tvSortMap[sortBy] ?? sortBy;

  const movieParams: Partial<TDiscoverMoviesParams> = {
    sort_by: movieSortBy as TDiscoverMoviesParams["sort_by"],
    year,
    with_genres: withGenres,
    "vote_average.gte": voteAverageGte,
    ...(needsVoteCount && { "vote_count.gte": 300 }),
  };

  const tvParams = {
    sort_by: tvSortBy,
    first_air_date_year: year,
    with_genres: withGenres,
    "vote_average.gte": voteAverageGte,
    ...(needsVoteCount && { "vote_count.gte": 300 }),
  };

  return { media_type: mediaType, movieParams, tvParams };
}

function getInitialFormValues(
  mediaTypeFromUrl?: "movie" | "tv" | null
): TDiscoverFiltersForm {
  const stored = getStoredDiscoverState();
  const base = stored?.formValues ?? DEFAULT_FILTER_VALUES;
  if (mediaTypeFromUrl && mediaTypeFromUrl !== base.media_type) {
    return { ...base, media_type: mediaTypeFromUrl, with_genres: [] };
  }
  return base;
}

export function useDiscoverFilters(mediaTypeFromUrl?: "movie" | "tv" | null) {
  const defaultValues = useMemo(
    () => getInitialFormValues(mediaTypeFromUrl),
    [mediaTypeFromUrl]
  );
  const form = useForm<TDiscoverFiltersForm>({
    defaultValues,
  });

  const formValues = useWatch({ control: form.control });
  const formValuesDebounced = useDebounce(formValues, 500);
  const filterParams = formValuesToParams(formValuesDebounced as TDiscoverFiltersForm);

  return {
    ...form,
    formValues,
    formValuesDebounced,
    filterParams,
  };
}
