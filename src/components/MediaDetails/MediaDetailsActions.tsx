"use client";

import type { TAccountStates } from "@/hooks/useAccountStatesQuery";
import { AddToWatchlistButton } from "@/features/Watchlist/components/AddToWatchlistButton";
import { RateMovieButton } from "@/features/RatedMedias/components/RateMovieButton";
import { SuggestToFriendForm } from "@/features/Suggestions/components/SuggestToFriendForm";

interface MediaDetailsActionsProps {
  mediaId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  accountStates: TAccountStates | null | undefined;
  onWatchlistChange: () => void;
  runtime?: number | null;
}

export function MediaDetailsActions({
  mediaId,
  mediaType,
  title,
  posterPath,
  isAuthenticated,
  isAuthLoading,
  accountStates,
  onWatchlistChange,
  runtime,
}: MediaDetailsActionsProps) {
  return (
    <>
      <div className="mt-6 flex flex-wrap gap-6">
        <AddToWatchlistButton
          mediaId={mediaId}
          mediaType={mediaType}
          isAuthenticated={isAuthenticated}
          isAuthLoading={isAuthLoading}
          accountStates={accountStates}
          onWatchlistChange={onWatchlistChange}
        />
        <RateMovieButton
          mediaId={mediaId}
          mediaType={mediaType}
          isAuthenticated={isAuthenticated}
          isAuthLoading={isAuthLoading}
          accountStates={accountStates}
          runtime={mediaType === "movie" ? runtime : undefined}
        />
      </div>

      <div className="mt-6">
        <SuggestToFriendForm
          mediaId={mediaId}
          mediaType={mediaType}
          title={title}
          posterPath={posterPath}
        />
      </div>
    </>
  );
}
