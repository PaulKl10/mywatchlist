import Image from "next/image";
import Link from "next/link";

import { TMDB_IMAGE_BASE } from "@/lib/constants";

type TProfileWatchlistItem = {
  id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  overview: string | null;
};

interface ProfileWatchlistCardProps {
  item: TProfileWatchlistItem;
}

function CardDetails({ item }: { item: TProfileWatchlistItem }) {
  return (
    <div className="hidden flex-1 flex-col p-3 group-hover:flex absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm rounded-b-lg">
      <h3 className="line-clamp-2 font-semibold text-zinc-900 dark:text-zinc-100">
        {item.title}
      </h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {item.release_date
          ? new Date(item.release_date).getFullYear()
          : "—"}
      </p>
      <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
        {item.overview || "Aucune description"}
      </p>
      {(item.vote_average ?? 0) > 0 && (
        <div className="mt-auto pt-2">
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            ★ {(item.vote_average ?? 0).toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}

export function ProfileWatchlistCard({ item }: ProfileWatchlistCardProps) {
  const href = item.media_type === "tv" ? `/tv/${item.id}` : `/movies/${item.id}`;

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-all hover:scale-105 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative aspect-2/3 w-full bg-zinc-200 dark:bg-zinc-800">
        <Image
          src={
            item.poster_path
              ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}`
              : "https://placehold.co/500x750/1f2937/9ca3af.png?text=No+Poster"
          }
          alt={item.title}
          fill
          loading="eager"
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
      </div>
      <CardDetails item={item} />
    </Link>
  );
}
