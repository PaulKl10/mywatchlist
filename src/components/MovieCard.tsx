import Image from "next/image";
import type { TMovie } from "@/types/movie.type";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

function MovieCardDetails({ movie }: { movie: TMovie }) {
  return (
    <div className="hidden flex-1 flex-col p-3 group-hover:flex absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm rounded-b-lg">
      <h3 className="line-clamp-2 font-semibold text-zinc-900 dark:text-zinc-100">
        {movie.title}
      </h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {movie.release_date ? new Date(movie.release_date).getFullYear() : "—"}
      </p>
      <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
        {movie.overview || "Aucune description"}
      </p>
      <div className="mt-auto pt-2">
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          ★ {movie.vote_average.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

export function MovieCard({ movie }: { movie: TMovie }) {
  return (
    <a
      href={`/movies/${movie.id}`}
      className="hover:scale-105 transition-all duration-300"
    >
      <article className="group flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative aspect-2/3 w-full bg-zinc-200 dark:bg-zinc-800">
          <Image
            src={
              movie.poster_path
                ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
                : "https://placehold.co/500x750/1f2937/9ca3af.png?text=No+Poster"
            }
            alt={movie.title}
            fill
            loading="eager"
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        </div>
        <MovieCardDetails movie={movie} />
      </article>
    </a>
  );
}
