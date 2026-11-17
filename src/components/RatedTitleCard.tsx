import Image from "next/image";
import Link from "next/link";
import { POSTER_GRID_SIZES, TMDB_IMAGE_BASE } from "@/lib/constants";
import { formatRating } from "@/lib/ratings/format";
import type { TMediaType } from "@/types/movie.type";

interface RatedTitleCardProps {
  id: number;
  mediaType: TMediaType;
  title: string;
  posterPath: string | null;
  /** Sur 10. */
  rating: number;
}

/** Affiche d'un film ou d'une série avec la note donnée par quelqu'un. */
export function RatedTitleCard({ id, mediaType, title, posterPath, rating }: RatedTitleCardProps) {
  const href = mediaType === "tv" ? `/tv/${id}` : `/movies/${id}`;
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-all hover:scale-105 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative aspect-2/3 w-full bg-zinc-200 dark:bg-zinc-800">
        <Image
          src={
            posterPath
              ? `${TMDB_IMAGE_BASE}/w500${posterPath}`
              : "https://placehold.co/500x750/1f2937/9ca3af.png?text=No+Poster"
          }
          alt={title}
          fill
          className="object-cover"
          sizes={POSTER_GRID_SIZES}
        />
      </div>
      <span
        className="absolute right-1.5 top-1.5 rounded-full bg-zinc-950/80 px-2 py-0.5 text-xs font-semibold text-amber-400"
        aria-label={`Note : ${formatRating(rating)} sur 10`}
      >
        ★ {formatRating(rating)}
      </span>
    </Link>
  );
}
