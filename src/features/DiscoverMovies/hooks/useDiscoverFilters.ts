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

function formValuesToParams(
  formValues: TDiscoverFiltersForm
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

function getInitialFormValues(): TDiscoverFiltersForm {
  const stored = getStoredDiscoverState();
  return stored?.formValues ?? DEFAULT_FILTER_VALUES;
}

export function useDiscoverFilters() {
  const defaultValues = useMemo(() => getInitialFormValues(), []);
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
