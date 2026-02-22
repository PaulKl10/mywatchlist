import type { TDiscoverFiltersForm } from "@/features/DiscoverMovies/types/discover-movies.type";

const STORAGE_KEY = "mywatchlist-discover-state";

export type StoredDiscoverState = {
  formValues: TDiscoverFiltersForm;
  page: number;
};

export function getStoredDiscoverState(): StoredDiscoverState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDiscoverState;
    if (
      parsed &&
      typeof parsed.page === "number" &&
      parsed.formValues &&
      typeof parsed.formValues === "object"
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveDiscoverState(
  formValues: TDiscoverFiltersForm,
  page: number
) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ formValues, page })
    );
  } catch {
    // ignore
  }
}
