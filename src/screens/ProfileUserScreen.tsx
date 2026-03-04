"use client";

import React, { use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bookmark, User } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

type ProfileUserScreenProps = {
  params: Promise<{ tmdbId: string }>;
};

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
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<boolean>(false);

  useEffect(() => {
    if (user && isOwnProfile) return;
    fetch(`/api/users/${tmdbId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setProfileUser)
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
    <div className="flex flex-col gap-10 px-4 md:px-32">
      <section className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
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
          <p className="text-zinc-500 dark:text-zinc-400">
            La watchlist de cet utilisateur est privée
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-700">
        <Bookmark className="mx-auto h-12 w-12 text-zinc-400" />
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          La watchlist de cet utilisateur n&apos;est pas accessible
        </p>
      </section>

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
