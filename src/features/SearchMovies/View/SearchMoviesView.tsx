"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { PageFilter } from "@/components/PageFilter";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchMoviesQuery } from "@/features/SearchMovies/hooks/useSearchMoviesQuery";

interface SearchMoviesViewProps {
  onClose: () => void;
}

export function SearchMoviesView({ onClose }: SearchMoviesViewProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const debouncedQuery = useDebounce(query, 500);

  const { data, isLoading, isError, error } = useSearchMoviesQuery(
    debouncedQuery,
    page,
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center gap-4 border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900 md:px-32">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-1 items-center gap-2"
        >
          <Search className="h-5 w-5 shrink-0 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un film..."
            className="flex-1 bg-transparent text-lg text-zinc-900 placeholder-zinc-500 focus:outline-none dark:text-zinc-100"
            autoFocus
          />
        </form>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="Fermer"
        >
          <X className="h-6 w-6" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-32">
        {!debouncedQuery ? (
          <p className="text-center text-zinc-500">
            Saisissez un titre de film pour rechercher
          </p>
        ) : isLoading ? (
          <>
            <div className="mb-6 flex flex-col gap-4">
              <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-2/3 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
                />
              ))}
            </div>
          </>
        ) : isError ? (
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            {error instanceof Error
              ? error.message
              : "Impossible de rechercher les films"}
          </p>
        ) : data && data.results.length > 0 ? (
          <>
            <div className="mb-6">
              <PageFilter
                currentPage={data.page}
                totalPages={data.total_pages}
                onPageChange={setPage}
                isLoading={isLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {data.results.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-zinc-500">
            Aucun film trouvé pour &quot;{debouncedQuery}&quot;
          </p>
        )}
      </main>
    </div>
  );
}
