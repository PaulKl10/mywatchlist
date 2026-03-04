"use client";

import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import type { TAccountStates } from "@/hooks/useAccountStatesQuery";
import {
  useAddToWatchlistMutation,
  useRemoveFromWatchlistMutation,
} from "@/features/Watchlist/hooks/useWatchlistMutation";

interface AddToWatchlistButtonProps {
  movieId: number;
  isAuthenticated: boolean;
  accountStates?: TAccountStates | null;
  onWatchlistChange?: () => void;
}

export function AddToWatchlistButton({
  movieId,
  isAuthenticated,
  accountStates,
  onWatchlistChange,
}: AddToWatchlistButtonProps) {
  const inWatchlist = accountStates?.watchlist ?? false;
  const addMutation = useAddToWatchlistMutation();
  const removeMutation = useRemoveFromWatchlistMutation();

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-2 rounded-lg border border-amber-500 px-4 py-2 text-sm font-medium text-amber-500 transition-colors hover:bg-amber-500/10"
      >
        <Bookmark className="h-4 w-4" />
        Connectez-vous pour ajouter à votre watchlist
      </Link>
    );
  }

  const isPending = addMutation.isPending || removeMutation.isPending;

  const handleClick = () => {
    if (inWatchlist) {
      removeMutation.mutate(movieId, {
        onSuccess: () => onWatchlistChange?.(),
      });
    } else {
      addMutation.mutate(movieId, {
        onSuccess: () => onWatchlistChange?.(),
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
        inWatchlist
          ? "border border-amber-500 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
          : "border border-amber-500 text-amber-500 hover:bg-amber-500/10"
      }`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : inWatchlist ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      {inWatchlist ? "Dans ma watchlist" : "Ajouter à ma watchlist"}
    </button>
  );
}
