"use client";

import Link from "next/link";
import Image from "next/image";
import { Check, User, UserPlus, X } from "lucide-react";
import { useFriendRequestsQuery } from "@/features/Profile/hooks/useFriendRequestsQuery";
import { useRespondToFriendRequestMutation } from "@/features/Profile/hooks/useRespondToFriendRequestMutation";
import { formatUserId } from "@/features/Profile/utils/formatUserId";

export function FriendRequestsList() {
  const { data: friendRequests, isLoading } = useFriendRequestsQuery(true);
  const respondMutation = useRespondToFriendRequestMutation();

  if (!friendRequests || friendRequests.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
        <UserPlus className="h-5 w-5" />
        Demandes d&apos;ami
      </h2>
      {isLoading ? (
        <div className="flex gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-20 w-full max-w-xs animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : !friendRequests || friendRequests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 py-6 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Aucune demande en attente
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {friendRequests.map((req) => {
            const s = req.sender;
            const gravatarUrl = s.gravatar_hash
              ? `https://secure.gravatar.com/avatar/${s.gravatar_hash}?s=64&d=identicon`
              : null;
            const tmdbUrl = s.tmdb_avatar_path
              ? `https://image.tmdb.org/t/p/w185${s.tmdb_avatar_path}`
              : null;
            const avatarUrl = gravatarUrl || tmdbUrl;
            const safeAvatar =
              avatarUrl &&
              avatarUrl.startsWith("https://") &&
              avatarUrl.length > 20
                ? avatarUrl
                : null;
            const isProcessing =
              respondMutation.isPending &&
              respondMutation.variables?.friendshipId === req.id;
            const isAccepting =
              isProcessing && respondMutation.variables?.action === "accept";
            const isDeclining =
              isProcessing && respondMutation.variables?.action === "decline";

            return (
              <div
                key={req.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <Link
                  href={`/profile/${s.tmdb_id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    {safeAvatar ? (
                      <Image
                        src={safeAvatar}
                        alt={s.username || "Avatar"}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-6 w-6 text-zinc-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                      {s.username || `Utilisateur ${s.tmdb_id}`}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {formatUserId(s.tmdb_id)}
                    </p>
                  </div>
                </Link>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      respondMutation.mutate({
                        friendshipId: req.id,
                        action: "accept",
                      })
                    }
                    disabled={respondMutation.isPending}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-500 py-3 px-3 md:py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                  >
                    {isAccepting ? (
                      <span className="h-4 w-4 animate-spin">⟳</span>
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span className="hidden md:inline">Accepter</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      respondMutation.mutate({
                        friendshipId: req.id,
                        action: "decline",
                      })
                    }
                    disabled={respondMutation.isPending}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-300 py-3 px-3 md:py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {isDeclining ? (
                      <span className="h-4 w-4 animate-spin">⟳</span>
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    <span className="hidden md:inline">Refuser</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
