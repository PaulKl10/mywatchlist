"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, Star } from "lucide-react";
import { useGetMovieDetailsQuery } from "@/features/MovieDetails/hooks/useGetMovieDetailsQuery";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

interface MovieDetailsViewProps {
  movieId: number;
}

export function MovieDetailsView({ movieId }: MovieDetailsViewProps) {
  const { data, isLoading, isError, error } = useGetMovieDetailsQuery(movieId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="relative h-64 animate-pulse bg-zinc-800 md:h-96" />
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-4 md:flex-row md:gap-8">
            <div className="aspect-2/3 w-full shrink-0 animate-pulse rounded-lg bg-zinc-800 md:w-64" />
            <div className="flex flex-1 flex-col gap-4">
              <div className="h-10 w-3/4 animate-pulse rounded bg-zinc-800" />
              <div className="h-4 w-1/4 animate-pulse rounded bg-zinc-800" />
              <div className="h-24 w-full animate-pulse rounded bg-zinc-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Erreur
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {error instanceof Error
            ? error.message
            : "Impossible de charger les détails du film"}
        </p>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="relative h-64 md:h-[700px]">
        <Image
          src={
            data.backdrop_path
              ? `${TMDB_IMAGE_BASE}/original${data.backdrop_path}`
              : "https://placehold.co/1920x1080/1f2937/9ca3af?text=No+Backdrop"
          }
          alt={data.title}
          fill
          className="object-cover object-top"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-6 -mt-64 z-50 relative py-8 md:py-0">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux films
        </Link>

        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          <div className="relative aspect-2/3 w-full shrink-0 overflow-hidden rounded-lg md:w-64">
            <Image
              src={
                data.poster_path
                  ? `${TMDB_IMAGE_BASE}/w500${data.poster_path}`
                  : "https://placehold.co/500x750/1f2937/9ca3af?text=No+Poster"
              }
              alt={data.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 256px"
            />
          </div>

          <div className="flex flex-1 flex-col">
            <h1 className="text-3xl font-bold text-zinc-100 md:text-4xl">
              {data.title}
            </h1>
            {data.original_title !== data.title && (
              <p className="mt-1 text-zinc-400">{data.original_title}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-400">
              {data.release_date && (
                <span>{new Date(data.release_date).getFullYear()}</span>
              )}
              {data.runtime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {data.runtime} min
                </span>
              )}
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {data.vote_average.toFixed(1)} ({data.vote_count} votes)
              </span>
            </div>

            {data.genres.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {data.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {data.tagline && (
              <p className="mt-4 italic text-zinc-500">{data.tagline}</p>
            )}

            <div className="mt-6">
              <h2 className="text-lg font-semibold text-zinc-100">Synopsis</h2>
              <p className="mt-2 line-clamp-none text-zinc-400">
                {data.overview || "Aucune description disponible."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
