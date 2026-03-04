"use client";

import Link from "next/link";
import Image from "next/image";
import { Bookmark, User } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { MovieCard } from "@/components/MovieCard";
import { useGetWatchlistQuery } from "@/features/Watchlist/hooks/useGetWatchlistQuery";
import { formatUserId } from "@/features/Profile/utils/formatUserId";
import { FriendsList } from "@/features/Profile/components/FriendsList";
import { FriendRequestsList } from "@/features/Profile/components/FriendRequestsList";

const WATCHLIST_PREVIEW_COUNT = 6;

export function ProfileView() {
  const { user } = useAuth();
  const { data: watchlistData, isLoading: watchlistLoading } =
    useGetWatchlistQuery(1);

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <p className="text-zinc-600 dark:text-zinc-400">
          Connectez-vous pour voir votre profil.
        </p>
        <Link
          href="/login"
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
        >
          Connexion
        </Link>
      </div>
    );
  }

  const gravatarHash = user.avatar?.gravatar?.hash?.trim() || null;
  const gravatarUrl = gravatarHash
    ? `https://secure.gravatar.com/avatar/${gravatarHash}?s=128&d=identicon`
    : null;
  const tmdbAvatarPath = user.avatar?.tmdb?.avatar_path?.trim() || null;
  const tmdbAvatarUrl = tmdbAvatarPath
    ? tmdbAvatarPath.startsWith("http")
      ? tmdbAvatarPath
      : `https://image.tmdb.org/t/p/w185${tmdbAvatarPath}`
    : null;
  const avatarUrl = gravatarUrl || tmdbAvatarUrl;
  const safeAvatarUrl =
    typeof avatarUrl === "string" &&
    avatarUrl.startsWith("https://") &&
    avatarUrl.length > 20
      ? avatarUrl
      : null;

  const previewMovies =
    watchlistData?.results?.slice(0, WATCHLIST_PREVIEW_COUNT) ?? [];

  return (
    <div className="flex flex-col gap-10 px-4 md:px-32">
      {/* Infos utilisateur */}
      <section className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          {safeAvatarUrl ? (
            <Image
              src={safeAvatarUrl}
              alt={user.username}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <User className="h-12 w-12 text-zinc-400" />
            </div>
          )}
        </div>
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {user.username || "Mon profil"}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {formatUserId(user.id)}
          </p>
          <p className="text-zinc-600 dark:text-zinc-400">
            {watchlistData
              ? `${watchlistData.total_results} film${watchlistData.total_results > 1 ? "s" : ""} dans ma watchlist`
              : "Ma watchlist"}
          </p>
        </div>
      </section>

      {/* Watchlist - aperçu */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
            <Bookmark className="h-5 w-5" />
            Ma watchlist
          </h2>
        </div>
        {watchlistLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: WATCHLIST_PREVIEW_COUNT }).map((_, i) => (
              <div
                key={i}
                className="aspect-2/3 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
              />
            ))}
          </div>
        ) : previewMovies.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400">
              Votre watchlist est vide
            </p>
            <Link
              href="/"
              className="mt-2 inline-block text-sm font-medium text-amber-600 hover:text-amber-500"
            >
              Découvrir des films
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {previewMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
        {watchlistData &&
          watchlistData.total_results > WATCHLIST_PREVIEW_COUNT && (
            <Link
              href="/watchlist"
              className="mt-4 flex w-full justify-center rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Afficher plus (
              {watchlistData.total_results - WATCHLIST_PREVIEW_COUNT} film
              {watchlistData.total_results - WATCHLIST_PREVIEW_COUNT > 1
                ? "s"
                : ""}
              )
            </Link>
          )}
      </section>

      <FriendRequestsList />
      <FriendsList />
    </div>
  );
}
