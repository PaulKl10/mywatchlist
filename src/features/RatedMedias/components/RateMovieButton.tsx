"use client";

import { Loader2, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { TAccountStates } from "@/hooks/useAccountStatesQuery";
import {
  useAddRatingMutation,
  useRemoveRatingMutation,
} from "@/features/RatedMedias/hooks/useRatingMutation";

const RATING_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

interface RateMovieButtonProps {
  mediaId: number;
  mediaType?: "movie" | "tv";
  isAuthenticated: boolean;
  isAuthLoading?: boolean;
  accountStates?: TAccountStates | null;
}

/** Calqué sur la version connectée : libellé, 10 étoiles (28px, 32px en md), aide. */
export function RateMovieButtonSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-2">
      <div className="h-5 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-7 w-70 animate-pulse rounded bg-zinc-200 md:h-8 md:w-80 dark:bg-zinc-800" />
      <div className="h-4 w-72 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

export function RateMovieButton({
  mediaId,
  mediaType = "movie",
  isAuthenticated,
  isAuthLoading,
  accountStates,
}: RateMovieButtonProps) {
  const addMutation = useAddRatingMutation();
  const removeMutation = useRemoveRatingMutation();

  const serverRating =
    typeof accountStates?.rated === "object" && accountStates?.rated?.value != null
      ? accountStates.rated.value
      : null;

  const [localOverride, setLocalOverride] = useState<{
    mediaId: number;
    rating: number | null;
  } | null>(null);

  const userRating =
    localOverride?.mediaId === mediaId ? localOverride.rating : serverRating;

  const handleRate = (value: number) => {
    const current = userRating;
    if (current === value) {
      setLocalOverride({ mediaId, rating: null });
      removeMutation.mutate({ mediaId, mediaType });
    } else {
      setLocalOverride({ mediaId, rating: value });
      addMutation.mutate({ mediaId, value, mediaType });
    }
  };

  if (isAuthLoading) {
    return <RateMovieButtonSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-2 rounded-lg border border-amber-500 px-4 py-2 text-sm font-medium text-amber-500 transition-colors hover:bg-amber-500/10"
      >
        <Star className="h-4 w-4" />
        Connectez-vous pour noter {mediaType === "tv" ? "cette série" : "ce film"}
      </Link>
    );
  }

  const isPending = addMutation.isPending || removeMutation.isPending;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {userRating != null
          ? `Votre note : ${userRating}/10`
          : mediaType === "tv"
            ? "Noter cette série"
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
