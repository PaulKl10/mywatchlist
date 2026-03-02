import { useEffect, useState } from "react";
import {
  DEFAULT_FILTER_VALUES,
} from "@/features/DiscoverMovies/components/DiscoverFilters";
import type { TDiscoverFiltersForm } from "@/features/DiscoverMovies/types/discover-movies.type";
import type { UseFormReset } from "react-hook-form";
import {
  getStoredDiscoverState,
  saveDiscoverState,
} from "@/features/DiscoverMovies/utils/discover-storage";

export function useDiscoverStatePersistence(
  formValues: TDiscoverFiltersForm,
  reset: UseFormReset<TDiscoverFiltersForm>
) {
  const [page, setPage] = useState(1);
  const [hasRestored, setHasRestored] = useState(false);

  useEffect(() => {
    const stored = getStoredDiscoverState();
    if (stored) {
      reset(stored.formValues);
      setPage(stored.page);
    }
    setHasRestored(true);
  }, [reset]);

  useEffect(() => {
    if (!hasRestored) return;
    saveDiscoverState(formValues, page);
  }, [formValues, page, hasRestored]);

  const handleFiltersReset = () => {
    reset(DEFAULT_FILTER_VALUES);
    setPage(1);
  };

  return { page, setPage, hasRestored, handleFiltersReset };
}
