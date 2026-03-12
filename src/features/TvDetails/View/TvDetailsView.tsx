"use client";

import { Film, Star } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useAccountStatesQuery } from "@/hooks/useAccountStatesQuery";
import { useGetTvDetailsQuery } from "@/features/TvDetails/hooks/useGetTvDetailsQuery";
import { useGetWatchProvidersQuery } from "@/features/TvDetails/hooks/useGetWatchProvidersQuery";
import { useGetCreditsQuery } from "@/features/TvDetails/hooks/useGetCreditsQuery";
import { useRouter } from "next/navigation";
import {
  MediaDetailsLoadingSkeleton,
  MediaDetailsErrorState,
  MediaDetailsLayout,
  MediaDetailsHeader,
  MediaDetailsActions,
  MediaDetailsSynopsis,
  MediaDetailsWatchProviders,
  MediaDetailsCast,
} from "@/components/MediaDetails";

interface TvDetailsViewProps {
  tvId: number;
}

export function TvDetailsView({ tvId }: TvDetailsViewProps) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data, isLoading, isError, error } = useGetTvDetailsQuery(tvId);
  const { data: watchProviders } = useGetWatchProvidersQuery(tvId);
  const { data: credits } = useGetCreditsQuery(tvId);
  const { data: accountStates, refetch: refetchAccountStates } =
    useAccountStatesQuery(tvId, !!user, "tv");

  if (isLoading) {
    return <MediaDetailsLoadingSkeleton />;
  }

  if (isError) {
    return (
      <MediaDetailsErrorState
        error={error}
        defaultMessage="Impossible de charger les détails de la série"
      />
    );
  }

  if (!data) return null;

  return (
    <MediaDetailsLayout
      backdropPath={data.backdrop_path}
      posterPath={data.poster_path}
      posterAlt={data.name}
      onBack={() => router.back()}
    >
      <MediaDetailsHeader
        title={data.name}
        originalTitle={data.original_name}
        metadata={
          <>
            {data.first_air_date && (
              <span>{new Date(data.first_air_date).getFullYear()}</span>
            )}
            {(data.number_of_seasons ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Film className="h-4 w-4" />
                {data.number_of_seasons} saison
                {(data.number_of_seasons ?? 0) > 1 ? "s" : ""}
                {(data.number_of_episodes ?? 0) > 0 &&
                  ` · ${data.number_of_episodes} épisode${(data.number_of_episodes ?? 0) > 1 ? "s" : ""}`}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {data.vote_average.toFixed(1)} ({data.vote_count} votes)
            </span>
          </>
        }
        genres={data.genres}
      />

      <MediaDetailsActions
        mediaId={data.id}
        mediaType="tv"
        title={data.name}
        posterPath={data.poster_path}
        isAuthenticated={!!user}
        isAuthLoading={isAuthLoading}
        accountStates={accountStates}
        onWatchlistChange={refetchAccountStates}
      />

      <MediaDetailsSynopsis overview={data.overview} />

      {watchProviders && (
        <MediaDetailsWatchProviders watchProviders={watchProviders} />
      )}

      {credits && <MediaDetailsCast cast={credits.cast} />}
    </MediaDetailsLayout>
  );
}
