import Image from "next/image";
import Link from "next/link";
import type { TCastMember } from "@/types/movie.type";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

interface CastCardProps {
  castMember: TCastMember;
}

export function CastCard({ castMember }: CastCardProps) {
  return (
    <Link
      href={`/person/${castMember.id}`}
      className="flex w-22 md:w-24 shrink-0 flex-col items-center gap-2 transition-opacity hover:opacity-80"
    >
      <div className="relative h-22 md:h-24 w-22 md:w-24 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <Image
          src={
            castMember.profile_path
              ? `${TMDB_IMAGE_BASE}/w185${castMember.profile_path}`
              : "https://placehold.co/96x96/27272a/71717a.png?text=?"
          }
          alt={castMember.name}
          fill
          className="object-cover object-center"
          sizes="96px"
        />
      </div>
      <div className="w-full overflow-hidden text-center">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {castMember.name}
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {castMember.character}
        </p>
      </div>
    </Link>
  );
}
