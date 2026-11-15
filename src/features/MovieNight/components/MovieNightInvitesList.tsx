"use client";

import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import type { TMovieNightInvite } from "@/lib/movie-night/types";
import { useRespondToInviteMutation } from "../hooks/useMovieNightMutations";

interface MovieNightInvitesListProps {
  invites: TMovieNightInvite[];
}

export function MovieNightInvitesList({ invites }: MovieNightInvitesListProps) {
  const router = useRouter();
  const respond = useRespondToInviteMutation();

  const handleRespond = (id: string, accept: boolean) => {
    respond.mutate(
      { id, accept },
      { onSuccess: (data) => accept && router.push(`/ce-soir/${data.id}`) },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {invites.map((invite) => (
          <li key={invite.movieNightId} className="flex items-center gap-3">
            {invite.hostAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={invite.hostAvatarUrl}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-full"
              />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                <User className="h-5 w-5 text-zinc-500" />
              </span>
            )}
            <span className="min-w-0 flex-1 truncate text-sm text-zinc-900 dark:text-zinc-100">
              <span className="font-medium">{invite.hostName}</span> vous invite
            </span>
            <button
              type="button"
              disabled={respond.isPending}
              onClick={() => handleRespond(invite.movieNightId, true)}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-zinc-900 hover:bg-amber-400 disabled:opacity-50"
            >
              Rejoindre
            </button>
            <button
              type="button"
              disabled={respond.isPending}
              onClick={() => handleRespond(invite.movieNightId, false)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Refuser
            </button>
          </li>
        ))}
      </ul>
      {respond.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {respond.error.message}
        </p>
      )}
    </div>
  );
}
