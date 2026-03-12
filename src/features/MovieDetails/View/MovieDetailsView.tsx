"use client";

import { Clock, Star } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useAccountStatesQuery } from "@/hooks/useAccountStatesQuery";
import { useGetMovieDetailsQuery } from "@/features/MovieDetails/hooks/useGetMovieDetailsQuery";
import { useGetMovieCreditsQuery } from "@/features/MovieDetails/hooks/useGetMovieCreditsQuery";
import { useGetWatchProvidersQuery } from "@/features/MovieDetails/hooks/useGetWatchProvidersQuery";
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

interface MovieDetailsViewProps {
  movieId: number;
}

export function MovieDetailsView({ movieId }: MovieDetailsViewProps) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data, isLoading, isError, error } = useGetMovieDetailsQuery(movieId);
  const { data: watchProviders } = useGetWatchProvidersQuery(movieId);
  const { data: credits } = useGetMovieCreditsQuery(movieId);
  const { data: accountStates, refetch: refetchAccountStates } =
    useAccountStatesQuery(movieId, !!user, "movie");

  if (isLoading) {
    return <MediaDetailsLoadingSkeleton />;
  }

  if (isError) {
    return (
      <MediaDetailsErrorState
        error={error}
        defaultMessage="Impossible de charger les détails du film"
      />
    );
  }

  if (!data) return null;

  return (
    <MediaDetailsLayout
      backdropPath={data.backdrop_path}
      posterPath={data.poster_path}
      posterAlt={data.title}
      onBack={() => router.back()}
    >
      <MediaDetailsHeader
        title={data.title}
        originalTitle={data.original_title}
        metadata={
          <>
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
          </>
        }
        genres={data.genres}
        tagline={data.tagline}
      />

      <MediaDetailsActions
        mediaId={data.id}
        mediaType="movie"
        title={data.title}
        posterPath={data.poster_path}
        isAuthenticated={!!user}
        isAuthLoading={isAuthLoading}
        accountStates={accountStates}
        onWatchlistChange={refetchAccountStates}
        runtime={data.runtime}
      />

      <MediaDetailsSynopsis overview={data.overview} />

      {watchProviders && (
        <MediaDetailsWatchProviders watchProviders={watchProviders} />
      )}

      {credits && <MediaDetailsCast cast={credits.cast} />}
    </MediaDetailsLayout>
  );
}
