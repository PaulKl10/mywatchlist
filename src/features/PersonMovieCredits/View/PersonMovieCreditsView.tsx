"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Film } from "lucide-react";
import { PersonMovieCard } from "@/features/PersonMovieCredits/components/PersonMovieCard";
import { useGetPersonDetailsQuery } from "@/features/PersonMovieCredits/hooks/useGetPersonDetailsQuery";
import { useGetPersonMovieCreditsQuery } from "@/features/PersonMovieCredits/hooks/useGetPersonMovieCreditsQuery";
import { TMDB_IMAGE_BASE } from "@/lib/constants";

interface PersonMovieCreditsViewProps {
  personId: number;
}

export function PersonMovieCreditsView({
  personId,
}: PersonMovieCreditsViewProps) {
  const router = useRouter();
  const { data: person, isLoading, isError, error } =
    useGetPersonDetailsQuery(personId);
  const { data: credits } = useGetPersonMovieCreditsQuery(personId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-32">
          <div className="flex flex-col gap-6 md:flex-row md:gap-8">
            <div className="aspect-square w-48 shrink-0 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex flex-1 flex-col gap-4">
              <div className="h-10 w-1/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-32 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
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
            : "Impossible de charger les informations"}
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      </div>
    );
  }

  if (!person) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-32">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        <div className="flex flex-col justify-center items-center gap-6 md:flex-row md:gap-8">
          <div className="relative aspect-square w-48 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <Image
              src={
                person.profile_path
                  ? `${TMDB_IMAGE_BASE}/w185${person.profile_path}`
                  : "https://placehold.co/185x185/27272a/71717a.png?text=?"
              }
              alt={person.name}
              fill
              className="object-cover object-top"
              sizes="192px"
            />
          </div>
          <div className="flex flex-1 flex-col">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 md:text-4xl text-center md:text-start">
              {person.name}
            </h1>
            {person.biography && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Biographie
                </h2>
                <p className="mt-2 line-clamp-6 text-zinc-600 dark:text-zinc-400 text-justify">
                  {person.biography}
                </p>
              </div>
            )}
          </div>
        </div>

        {credits && credits.cast.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              <Film className="h-6 w-6" />
              Filmographie ({credits.cast.length} films)
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {credits.cast.map((credit) => (
                <PersonMovieCard
                  key={`${credit.id}-${credit.character}`}
                  credit={credit}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
