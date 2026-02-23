import Image from "next/image";
import type { TPersonMovieCredit } from "@/types/movie.type";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

interface PersonMovieCardProps {
  credit: TPersonMovieCredit;
}

export function PersonMovieCard({ credit }: PersonMovieCardProps) {
  return (
    <a
      href={`/movies/${credit.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-all hover:scale-105 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative aspect-2/3 w-full bg-zinc-200 dark:bg-zinc-800">
        <Image
          src={
            credit.poster_path
              ? `${TMDB_IMAGE_BASE}${credit.poster_path}`
              : "https://placehold.co/500x750/1f2937/9ca3af.png?text=No+Poster"
          }
          alt={credit.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
      </div>
      <div className="flex flex-col p-3">
        <h3 className="line-clamp-2 font-semibold text-zinc-900 dark:text-zinc-100">
          {credit.title}
        </h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {credit.release_date
            ? new Date(credit.release_date).getFullYear()
            : "—"}
        </p>
        {credit.character && (
          <p className="mt-0.5 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
            {credit.character}
          </p>
        )}
        <div className="mt-2">
          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            ★ {credit.vote_average.toFixed(1)}
          </span>
        </div>
      </div>
    </a>
  );
}
