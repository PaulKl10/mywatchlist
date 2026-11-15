"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { useFriendsQuery, type TFriend } from "@/features/Profile/hooks/useFriendsQuery";
import { TMDB_IMAGE_BASE } from "@/lib/constants";
import type { TMovieNightState } from "@/lib/movie-night/types";

interface InviteFriendsPanelProps {
  state: TMovieNightState;
  onInvite: (friendId: string) => void;
  pendingFriendId: string | null;
  errorMessage: string | null;
}

function friendAvatarUrl(friend: TFriend): string | null {
  const url = friend.gravatar_hash
    ? `https://secure.gravatar.com/avatar/${friend.gravatar_hash}?s=64&d=identicon`
    : friend.tmdb_avatar_path
      ? `${TMDB_IMAGE_BASE}/w185${friend.tmdb_avatar_path}`
      : null;
  return url && url.startsWith("https://") ? url : null;
}

export function InviteFriendsPanel({
  state,
  onInvite,
  pendingFriendId,
  errorMessage,
}: InviteFriendsPanelProps) {
  const { data: friends, isLoading } = useFriendsQuery(true);
  const invited = new Set(state.invitedFriendIds);
  const inSession = new Set(
    state.participants.map((p) => p.userId).filter((id): id is string => id !== null),
  );

  return (
    <div>
      {isLoading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Chargement…</p>
      ) : !friends || friends.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Vous n&apos;avez pas encore d&apos;amis à inviter.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {friends.map((friend) => {
            const avatar = friendAvatarUrl(friend);
            const name = friend.username ?? "Ami";
            return (
              <li key={friend.id} className="flex items-center gap-3">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt=""
                    width={40}
                    height={40}
                    unoptimized
                    className="h-10 w-10 shrink-0 rounded-full"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <User className="h-5 w-5 text-zinc-500" />
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {name}
                </span>
                {inSession.has(friend.id) ? (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Dans la session</span>
                ) : invited.has(friend.id) ? (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Invité</span>
                ) : (
                  <button
                    type="button"
                    disabled={pendingFriendId !== null}
                    onClick={() => onInvite(friend.id)}
                    aria-label={`Inviter ${name}`}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-zinc-900 hover:bg-amber-400 disabled:opacity-50"
                  >
                    Inviter
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {errorMessage && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
