import type { ReactNode } from "react";
import Link from "next/link";
import type { TDeckMovie } from "@/lib/movie-night/types";
import { MoviePoster } from "./MoviePoster";

const linkClass =
  "font-medium text-amber-600 underline underline-offset-2 hover:text-amber-500 dark:text-amber-500";

interface MovieNightEndedProps {
  /** Film retenu ; null : session terminée sans film. */
  movie: TDeckMovie | null;
  /** Action en plus, entre la fiche du film et le retour (ex. « Reprendre la pile » en solo). */
  children?: ReactNode;
}

export function MovieNightEnded({ movie, children }: MovieNightEndedProps) {
  if (!movie) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-base text-zinc-900 dark:text-zinc-100">La session est terminée.</p>
        <Link href="/ce-soir" className={linkClass}>
          Retour à Ce soir ?
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 py-6 text-center">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Ce soir : <span className="text-amber-600 dark:text-amber-500">{movie.title}</span>
      </h2>
      <Link href={`/movies/${movie.id}`} aria-label={`Voir la fiche de ${movie.title}`}>
        <MoviePoster title={movie.title} posterPath={movie.posterPath} className="w-44" priority />
      </Link>
      <Link href={`/movies/${movie.id}`} className={linkClass}>
        Voir la fiche du film
      </Link>
      {children}
      <Link href="/ce-soir" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
        Retour à Ce soir ?
      </Link>
    </div>
  );
}
