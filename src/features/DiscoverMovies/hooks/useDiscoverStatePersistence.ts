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

function getInitialPage(): number {
  const stored = getStoredDiscoverState();
  return stored?.page ?? 1;
}

export function useDiscoverStatePersistence(
  formValues: Partial<TDiscoverFiltersForm>,
  reset: UseFormReset<TDiscoverFiltersForm>
) {
  const [page, setPage] = useState(getInitialPage);

  useEffect(() => {
    const merged: TDiscoverFiltersForm = {
      ...DEFAULT_FILTER_VALUES,
      ...formValues,
    };
    saveDiscoverState(merged, page);
  }, [formValues, page]);

  const handleFiltersReset = () => {
    reset(DEFAULT_FILTER_VALUES);
    setPage(1);
  };

  return { page, setPage, handleFiltersReset };
}
