import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { TRatedMovie } from "@/types/movie.type";
import { TMDB_IMAGE_BASE } from "@/lib/constants";

interface RatedMovieCardProps {
  movie: TRatedMovie;
}

export function RatedMovieCard({ movie }: RatedMovieCardProps) {
  return (
    <Link
      href={`/movies/${movie.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-all hover:scale-105 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative aspect-2/3 w-full bg-zinc-200 dark:bg-zinc-800">
        <Image
          src={
            movie.poster_path
              ? `${TMDB_IMAGE_BASE}/w500${movie.poster_path}`
              : "https://placehold.co/500x750/1f2937/9ca3af.png?text=No+Poster"
          }
          alt={movie.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
      </div>
      <div className="flex flex-col p-3">
        <h3 className="line-clamp-2 font-semibold text-zinc-900 dark:text-zinc-100">
          {movie.title}
        </h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {movie.release_date
            ? new Date(movie.release_date).getFullYear()
            : "—"}
        </p>
        <div className="mt-2 flex items-center gap-1">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
            {movie.rating}/10
          </span>
        </div>
      </div>
    </Link>
  );
}
