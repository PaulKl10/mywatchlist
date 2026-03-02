import { useForm } from "react-hook-form";
import {
  DEFAULT_FILTER_VALUES,
} from "@/features/DiscoverMovies/components/DiscoverFilters";
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

export function useDiscoverFilters() {
  const form = useForm<TDiscoverFiltersForm>({
    defaultValues: DEFAULT_FILTER_VALUES,
  });

  const formValues = form.watch();
  const formValuesDebounced = useDebounce(formValues, 500);
  const filterParams = formValuesToParams(formValuesDebounced);

  return {
    ...form,
    formValues,
    formValuesDebounced,
    filterParams,
  };
}
