"use client";

import { useState } from "react";
import Link from "next/link";
import { PageFilter } from "@/components/PageFilter";
import { RatedMovieCard } from "@/features/RatedMovies/components/RatedMovieCard";
import { useGetRatedMoviesQuery } from "@/features/RatedMovies/hooks/useGetRatedMoviesQuery";
import { Star } from "lucide-react";

export function RatedMoviesView() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useGetRatedMoviesQuery(page);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-2/3 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    const isUnauthorized =
      error &&
      typeof error === "object" &&
      "response" in error &&
      (error as { response?: { status?: number } }).response?.status === 401;

    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-zinc-600 dark:text-zinc-400">
          {isUnauthorized
            ? "Connectez-vous pour voir vos films notés."
            : error instanceof Error
              ? error.message
              : "Impossible de charger les films notés"}
        </p>
        <div className="flex gap-3">
          {isUnauthorized ? (
            <Link
              href="/login"
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
            >
              Se connecter
            </Link>
          ) : null}
          <Link
            href="/"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600"
          >
            Retour
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950 md:px-32">
        <h2 className="flex items-center gap-2 text-lg font-medium text-zinc-700 dark:text-zinc-300">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          Mes films notés ({data.total_results} film
          {data.total_results > 1 ? "s" : ""})
        </h2>
        <PageFilter
          currentPage={data.page}
          totalPages={data.total_pages}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      </div>
      {data.results.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">
            Vous n&apos;avez pas encore noté de film. Notez des films depuis la
            page de détails !
          </p>
          <Link
            href="/"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            Découvrir des films
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 px-4 sm:grid-cols-3 md:grid-cols-4 md:px-32 lg:grid-cols-5">
          {data.results.map((movie) => (
            <RatedMovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
