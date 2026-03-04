"use client";

import Link from "next/link";
import Image from "next/image";
import { User, Users } from "lucide-react";
import { useFriendsQuery } from "@/features/Profile/hooks/useFriendsQuery";
import { formatUserId } from "@/features/Profile/utils/formatUserId";
import { AddFriendButton } from "./AddFriendButton";

export function FriendsList() {
  const { data: friends, isLoading } = useFriendsQuery(true);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          <Users className="h-5 w-5" />
          Amis
        </h2>
        <AddFriendButton />
      </div>
      {isLoading ? (
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : !friends || friends.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 py-8 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            Vous n&apos;avez pas encore d&apos;amis
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {friends.map((friend) => {
            const friendGravatarUrl = friend.gravatar_hash
              ? `https://secure.gravatar.com/avatar/${friend.gravatar_hash}?s=64&d=identicon`
              : null;
            const friendTmdbUrl = friend.tmdb_avatar_path
              ? `https://image.tmdb.org/t/p/w185${friend.tmdb_avatar_path}`
              : null;
            const friendAvatarUrl = friendGravatarUrl || friendTmdbUrl;
            const friendSafeAvatar =
              friendAvatarUrl &&
              friendAvatarUrl.startsWith("https://") &&
              friendAvatarUrl.length > 20
                ? friendAvatarUrl
                : null;

            return (
              <Link
                key={friend.id}
                href={`/profile/${friend.tmdb_id}`}
                className="flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <div className="relative h-14 w-14 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  {friendSafeAvatar ? (
                    <Image
                      src={friendSafeAvatar}
                      alt={friend.username || "Ami"}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User className="h-7 w-7 text-zinc-400" />
                    </div>
                  )}
                </div>
                <span className="max-w-[80px] truncate text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {friend.username || `Utilisateur ${friend.tmdb_id}`}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatUserId(friend.tmdb_id)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
