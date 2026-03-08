"use client";

import { Loader2, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { TAccountStates } from "@/hooks/useAccountStatesQuery";
import {
  useAddRatingMutation,
  useRemoveRatingMutation,
} from "@/features/RatedMovies/hooks/useRatingMutation";

const RATING_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

interface RateMovieButtonProps {
  movieId: number;
  isAuthenticated: boolean;
  isAuthLoading?: boolean;
  accountStates?: TAccountStates | null;
  runtime?: number | null;
}

export function RateMovieButton({
  movieId,
  isAuthenticated,
  isAuthLoading,
  accountStates,
  runtime,
}: RateMovieButtonProps) {
  const addMutation = useAddRatingMutation();
  const removeMutation = useRemoveRatingMutation();

  const serverRating =
    typeof accountStates?.rated === "object" && accountStates?.rated?.value != null
      ? accountStates.rated.value
      : null;

  const [localOverride, setLocalOverride] = useState<{
    movieId: number;
    rating: number | null;
  } | null>(null);

  const userRating =
    localOverride?.movieId === movieId ? localOverride.rating : serverRating;

  const handleRate = (value: number) => {
    const current = userRating;
    if (current === value) {
      setLocalOverride({ movieId, rating: null });
      removeMutation.mutate(movieId);
    } else {
      setLocalOverride({ movieId, rating: value });
      addMutation.mutate({ movieId, value, runtime });
    }
  };

  if (isAuthLoading) {
    return (
      <div className="inline-flex h-10 w-44 animate-pulse items-center rounded-lg border border-zinc-300 bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800" />
    );
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-2 rounded-lg border border-amber-500 px-4 py-2 text-sm font-medium text-amber-500 transition-colors hover:bg-amber-500/10"
      >
        <Star className="h-4 w-4" />
        Connectez-vous pour noter ce film
      </Link>
    );
  }

  const isPending = addMutation.isPending || removeMutation.isPending;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {userRating != null
          ? `Votre note : ${userRating}/10`
          : "Noter ce film"}
      </p>
      <div className="flex items-center justify-between">
        {RATING_OPTIONS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleRate(value)}
            disabled={isPending}
            className={`rounded p-1 transition-colors disabled:opacity-50 ${
              userRating != null && userRating >= value
                ? "text-amber-500 hover:text-amber-400"
                : "text-zinc-400 hover:text-amber-500/70"
            }`}
            title={`Noter ${value}/10`}
          >
            <Star
              className={`h-5 w-5 md:h-6 md:w-6 ${
                userRating != null && userRating >= value ? "fill-current" : ""
              }`}
            />
          </button>
        ))}
        {isPending && (
          <Loader2 className="ml-2 h-5 w-5 animate-spin text-zinc-500" />
        )}
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Cliquez sur une étoile pour noter. Recliquez pour retirer.
      </p>
    </div>
  );
}
