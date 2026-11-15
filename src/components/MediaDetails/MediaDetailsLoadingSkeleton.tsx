import { AddToWatchlistButtonSkeleton } from "@/features/Watchlist/components/AddToWatchlistButton";
import { RateMovieButtonSkeleton } from "@/features/RatedMedias/components/RateMovieButton";
import { MediaDetailsBackButton } from "./MediaDetailsBackButton";

const BLOCK = "animate-pulse bg-zinc-200 dark:bg-zinc-800";

interface MediaDetailsLoadingSkeletonProps {
  onBack: () => void;
}

/**
 * Reprend la structure de `MediaDetailsLayout` (backdrop, chevauchement
 * `-mt-64`, conteneur `max-w-[80%]`, bouton Retour, poster pleine largeur
 * en mobile) pour que le contenu s'affiche exactement à la même place.
 */
export function MediaDetailsLoadingSkeleton({
  onBack,
}: MediaDetailsLoadingSkeletonProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" aria-busy="true">
      <div className="relative h-64 animate-pulse bg-zinc-800 md:h-[700px]">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-zinc-50/60 to-transparent dark:from-zinc-950 dark:via-zinc-950/60 dark:to-transparent" />
      </div>

      <div className="relative z-50 -mt-64 mx-auto max-w-[80%] py-8 md:pr-6 md:py-0">
        <MediaDetailsBackButton onBack={onBack} />

        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          <div
            className={`aspect-2/3 w-full shrink-0 rounded-lg md:w-1/3 ${BLOCK}`}
          />

          <div aria-hidden className="flex flex-1 flex-col">
            {/* MediaDetailsHeader */}
            <div className={`h-9 w-3/4 rounded md:h-10 ${BLOCK}`} />
            <div className={`mt-4 h-5 w-1/2 rounded ${BLOCK}`} />
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`h-7 w-20 rounded-full ${BLOCK}`} />
              ))}
            </div>

            {/* MediaDetailsActions */}
            <div className="mt-6 flex flex-wrap gap-6">
              <AddToWatchlistButtonSkeleton />
              <RateMovieButtonSkeleton />
            </div>

            {/* MediaDetailsSynopsis */}
            <div className="mt-6">
              <div className={`h-7 w-28 rounded ${BLOCK}`} />
              <div className={`mt-2 h-24 w-full rounded ${BLOCK}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
