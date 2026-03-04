"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bookmark, User, UserMinus } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useRemoveFriendMutation } from "@/features/Profile/hooks/useRemoveFriendMutation";
import { MovieCard } from "@/components/MovieCard";
import type { TMovie } from "@/types/movie.type";

type ProfileUserScreenProps = {
  params: Promise<{ tmdbId: string }>;
};

const WATCHLIST_PREVIEW_COUNT = 6;

type TPublicWatchlistItem = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
};

function toMovie(item: TPublicWatchlistItem): TMovie {
  return {
    ...item,
    adult: false,
    backdrop_path: "",
    genre_ids: [],
    original_language: "fr",
    original_title: item.title,
    popularity: 0,
    video: false,
    vote_count: 0,
  };
}

export function ProfileUserScreen({ params }: ProfileUserScreenProps) {
  const { tmdbId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const tmdbIdNum = parseInt(tmdbId, 10);
  const isOwnProfile = user?.id === tmdbIdNum;

  useEffect(() => {
    if (!user) return;
    if (isOwnProfile) {
      router.replace("/profile");
    }
  }, [user, isOwnProfile, router]);

  const [profileUser, setProfileUser] = React.useState<{
    tmdb_id: number;
    username: string | null;
    gravatar_hash: string | null;
    tmdb_avatar_path: string | null;
  } | null>(null);
  const [watchlist, setWatchlist] = React.useState<TPublicWatchlistItem[] | null>(null);
  const [showAllWatchlist, setShowAllWatchlist] = React.useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [loading, setLoading] = React.useState(true);
  const removeMutation = useRemoveFriendMutation();
  const [error, setError] = React.useState<boolean>(false);

  useEffect(() => {
    if (user && isOwnProfile) return;
    Promise.all([
      fetch(`/api/users/${tmdbId}`).then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      }),
      fetch(`/api/users/${tmdbId}/watchlist`).then((res) =>
        res.ok ? res.json() : null
      ),
    ])
      .then(([userData, watchlistData]) => {
        setProfileUser(userData);
        setWatchlist(watchlistData?.watchlist ?? null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [tmdbId, user, isOwnProfile]);

  if (user && isOwnProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-zinc-500">Redirection vers votre profil…</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-24 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-6 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-zinc-600 dark:text-zinc-400">
          Utilisateur introuvable
        </p>
        <Link
          href="/profile"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
        >
          Retour à mon profil
        </Link>
      </div>
    );
  }

  const gravatarUrl = profileUser.gravatar_hash
    ? `https://secure.gravatar.com/avatar/${profileUser.gravatar_hash}?s=128&d=identicon`
    : null;
  const tmdbUrl = profileUser.tmdb_avatar_path
    ? `https://image.tmdb.org/t/p/w185${profileUser.tmdb_avatar_path}`
    : null;
  const avatarUrl = gravatarUrl || tmdbUrl;
  const safeAvatarUrl =
    avatarUrl && avatarUrl.startsWith("https://") && avatarUrl.length > 20
      ? avatarUrl
      : null;

  return (
    <div className="flex flex-col gap-10 px-4 md:px-32 py-12">
      <section className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex flex-1 flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          {safeAvatarUrl ? (
            <Image
              src={safeAvatarUrl}
              alt={profileUser.username || "Avatar"}
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
            {profileUser.username || `Utilisateur ${profileUser.tmdb_id}`}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 px-8 md:px-0">
            {watchlist !== null
              ? watchlist.length > 0
                ? `${watchlist.length} film${watchlist.length > 1 ? "s" : ""} dans sa watchlist`
                : "Sa watchlist est vide"
              : "Ajoutez cette personne en ami pour voir sa watchlist"}
          </p>
        </div>
        {watchlist !== null && (
          <button
            type="button"
            onClick={() => setShowRemoveConfirm(true)}
            className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            <UserMinus className="h-4 w-4" />
            Supprimer des amis
          </button>
        )}
        </div>
      </section>

      {showRemoveConfirm && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            aria-hidden
            onClick={() => setShowRemoveConfirm(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Supprimer un ami
            </h3>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Êtes-vous sûr de vouloir supprimer{" "}
              <strong>
                {profileUser.username || `Utilisateur ${profileUser.tmdb_id}`}
              </strong>{" "}
              de vos amis ?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRemoveConfirm(false)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  removeMutation.mutate(tmdbIdNum, {
                    onSuccess: () => router.push("/profile"),
                    onSettled: () => setShowRemoveConfirm(false),
                  });
                }}
                disabled={removeMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {removeMutation.isPending ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </>
      )}

      {watchlist && watchlist.length > 0 ? (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
            <Bookmark className="h-5 w-5" />
            Watchlist
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {(showAllWatchlist ? watchlist : watchlist.slice(0, WATCHLIST_PREVIEW_COUNT)).map(
              (item) => (
                <MovieCard key={item.id} movie={toMovie(item)} />
              )
            )}
          </div>
          {!showAllWatchlist && watchlist.length > WATCHLIST_PREVIEW_COUNT && (
            <button
              type="button"
              onClick={() => setShowAllWatchlist(true)}
              className="mt-4 w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Voir plus ({watchlist.length - WATCHLIST_PREVIEW_COUNT} film
              {watchlist.length - WATCHLIST_PREVIEW_COUNT > 1 ? "s" : ""})
            </button>
          )}
          {showAllWatchlist && (
            <button
              type="button"
              onClick={() => setShowAllWatchlist(false)}
              className="mt-4 w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Voir moins
            </button>
          )}
        </section>
      ) : watchlist !== null ? (
        <section className="rounded-lg border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-700">
          <Bookmark className="mx-auto h-12 w-12 text-zinc-400" />
          <p className="mt-2 text-zinc-500 dark:text-zinc-400 px-8 md:px-0">
            Sa watchlist est vide
          </p>
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-700">
          <Bookmark className="mx-auto h-12 w-12 text-zinc-400" />
          <p className="mt-2 text-zinc-500 dark:text-zinc-400 px-8 md:px-0">
            Ajoutez cette personne en ami pour voir sa watchlist
          </p>
        </section>
      )}

      <section>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-500"
        >
          ← Retour à mon profil
        </Link>
      </section>
    </div>
  );
}
