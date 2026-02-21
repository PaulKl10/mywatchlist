"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PageFilterProps {
  currentPage: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function PageFilter({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: PageFilterProps) {
  const canGoPrev = currentPage > 1 && !isLoading;
  const canGoNext =
    (totalPages ? currentPage < totalPages : true) && !isLoading;

  return (
    <div className="flex items-center justify-center gap-4 self-end">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrev}
          className="rounded-lg border border-zinc-300 p-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-md font-medium text-zinc-600 dark:text-zinc-400">
          {totalPages
            ? `${currentPage} / ${totalPages}`
            : `${currentPage}`}
        </p>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="rounded-lg border border-zinc-300 p-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
