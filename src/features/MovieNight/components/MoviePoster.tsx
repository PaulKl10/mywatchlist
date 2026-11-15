import Image from "next/image";
import { Film } from "lucide-react";
import { TMDB_IMAGE_BASE } from "@/lib/constants";

interface MoviePosterProps {
  title: string;
  posterPath: string | null;
  /** Classes de taille (largeur ; la hauteur suit le ratio 2/3). */
  className: string;
  priority?: boolean;
}

export function MoviePoster({ title, posterPath, className, priority = false }: MoviePosterProps) {
  return (
    <div
      className={`relative aspect-[2/3] shrink-0 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800 ${className}`}
    >
      {posterPath ? (
        <Image
          src={`${TMDB_IMAGE_BASE}/w342${posterPath}`}
          alt={`Affiche de ${title}`}
          fill
          sizes="(min-width: 640px) 192px, 40vw"
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-zinc-500" role="img" aria-label={`Pas d'affiche pour ${title}`}>
          <Film className="h-8 w-8" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
