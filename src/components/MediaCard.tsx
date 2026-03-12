import Image from "next/image";
import Link from "next/link";
import type {
  TMultiSearchMovie,
  TMultiSearchTv,
  TMultiSearchPerson,
} from "@/types/search.type";

import { TMDB_IMAGE_BASE } from "@/lib/constants";

function MovieOrTvCardDetails({
  title,
  date,
  overview,
  voteAverage,
}: {
  title: string;
  date: string;
  overview: string;
  voteAverage: number;
}) {
  const year = date ? new Date(date).getFullYear() : "—";
  return (
    <div className="hidden flex-1 flex-col p-3 group-hover:flex absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm rounded-b-lg">
      <h3 className="line-clamp-2 font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{year}</p>
      <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
        {overview || "Aucune description"}
      </p>
      <div className="mt-auto pt-2">
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          ★ {(voteAverage ?? 0).toFixed(1)}
        </span>
      </div>
    </div>
  );
}

function MovieCard({
  item,
  onClick,
}: {
  item: TMultiSearchMovie;
  onClick?: () => void;
}) {
  return (
    <Link
      href={`/movies/${item.id}`}
      onClick={onClick}
      className="hover:scale-105 transition-all duration-300"
    >
      <article className="relative group flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
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
        <MovieOrTvCardDetails
          title={item.title}
          date={item.release_date ?? ""}
          overview={item.overview ?? ""}
          voteAverage={item.vote_average ?? 0}
        />
      </article>
    </Link>
  );
}

function TvCard({
  item,
  onClick,
}: {
  item: TMultiSearchTv;
  onClick?: () => void;
}) {
  return (
    <Link
      href={`/tv/${item.id}`}
      onClick={onClick}
      className="hover:scale-105 transition-all duration-300"
    >
      <article className="relative group flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative aspect-2/3 w-full bg-zinc-200 dark:bg-zinc-800">
          <Image
            src={
              item.poster_path
                ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}`
                : "https://placehold.co/500x750/1f2937/9ca3af.png?text=No+Poster"
            }
            alt={item.name}
            fill
            loading="eager"
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        </div>
        <MovieOrTvCardDetails
          title={item.name}
          date={item.first_air_date ?? ""}
          overview={item.overview ?? ""}
          voteAverage={item.vote_average ?? 0}
        />
      </article>
    </Link>
  );
}

function PersonCard({
  item,
  onClick,
}: {
  item: TMultiSearchPerson;
  onClick?: () => void;
}) {
  return (
    <Link
      href={`/person/${item.id}`}
      onClick={onClick}
      className="hover:scale-105 transition-all duration-300"
    >
      <article className="relative group flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative aspect-2/3 w-full bg-zinc-200 dark:bg-zinc-800">
          <Image
            src={
              item.profile_path
                ? `${TMDB_IMAGE_BASE}/w185${item.profile_path}`
                : "https://placehold.co/500x750/1f2937/9ca3af.png?text=No+Photo"
            }
            alt={item.name}
            fill
            loading="eager"
            className="object-cover object-top"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        </div>
        <div className="flex-1 flex-col p-3 flex absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm rounded-b-lg">
          <h3 className="line-clamp-2 font-semibold text-zinc-900 dark:text-zinc-100">
            {item.name}
          </h3>
          {item.known_for_department && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {item.known_for_department}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

export function MediaCard({
  item,
  onClick,
}: {
  item: TMultiSearchMovie | TMultiSearchTv | TMultiSearchPerson;
  onClick?: () => void;
}) {
  if (item.media_type === "movie") {
    return <MovieCard item={item} onClick={onClick} />;
  }
  if (item.media_type === "tv") {
    return <TvCard item={item} onClick={onClick} />;
  }
  return <PersonCard item={item} onClick={onClick} />;
}
