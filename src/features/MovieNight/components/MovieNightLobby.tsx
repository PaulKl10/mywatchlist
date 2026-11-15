"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { User, X } from "lucide-react";
import { formatMovieNightCode } from "@/lib/movie-night/code";
import type { TMovieNightState } from "@/lib/movie-night/types";
import { useMovieNightMutations } from "../hooks/useMovieNightMutations";
import { InviteFriendsPanel } from "./InviteFriendsPanel";

const sectionClass =
  "rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900";
const titleClass = "mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100";
const secondaryButtonClass =
  "rounded-lg border border-zinc-300 px-4 py-2.5 text-base font-medium text-zinc-800 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";

interface MovieNightLobbyProps {
  id: string;
  state: TMovieNightState;
  onLeft: () => void;
}

export function MovieNightLobby({ id, state, onLeft }: MovieNightLobbyProps) {
  const { start, leave, remove, invite } = useMovieNightMutations(id);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHost = state.me.isHost;
  const host = state.participants.find((p) => p.isHost);
  const code = state.code;

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleShare = async () => {
    if (!code) return;
    const url = `${window.location.origin}/ce-soir?code=${code}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ url });
      } catch {
        // partage annulé
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // presse-papiers indisponible
    }
  };

  const handleLeave = () => {
    leave.mutate(undefined, { onSuccess: onLeft });
  };

  return (
    <div className="flex flex-col gap-4">
      {code && (
        <section className={`${sectionClass} text-center`} aria-labelledby="code-title">
          <h2 id="code-title" className="text-sm text-zinc-600 dark:text-zinc-400">
            Code de la session
          </h2>
          <p className="my-2 font-mono text-4xl font-bold tracking-widest text-zinc-900 dark:text-zinc-100">
            {formatMovieNightCode(code)}
          </p>
          <button type="button" onClick={handleShare} className={secondaryButtonClass}>
            Partager
          </button>
          <p role="status" className="mt-2 h-5 text-sm text-amber-600 dark:text-amber-500">
            {copied ? "Lien copié" : ""}
          </p>
        </section>
      )}

      <section className={sectionClass} aria-labelledby="participants-title">
        <h2 id="participants-title" className={titleClass}>
          Participants
        </h2>
        <ul className="flex flex-col gap-3">
          {state.participants.map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              {p.avatarUrl ? (
                <Image
                  src={p.avatarUrl}
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
                {p.name}
              </span>
              {p.isHost && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  hôte
                </span>
              )}
              {p.isGuest && (
                <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                  invité
                </span>
              )}
              {isHost && p.id !== state.me.participantId && (
                <button
                  type="button"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(p.id)}
                  aria-label={`Retirer ${p.name}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-red-600 disabled:opacity-50 dark:hover:bg-zinc-800"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
        {remove.error && (
          <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
            {remove.error.message}
          </p>
        )}
      </section>

      {isHost && (
        <section className={sectionClass} aria-labelledby="invite-title">
          <h2 id="invite-title" className={titleClass}>
            Inviter un ami
          </h2>
          <InviteFriendsPanel
            state={state}
            onInvite={(friendId) => invite.mutate(friendId)}
            pendingFriendId={invite.isPending ? (invite.variables ?? "") : null}
            errorMessage={invite.error?.message ?? null}
          />
        </section>
      )}

      <div className="flex flex-col gap-3">
        {isHost ? (
          <>
            <button
              type="button"
              disabled={start.isPending}
              onClick={() => start.mutate()}
              className="rounded-lg bg-amber-500 px-4 py-2.5 text-base font-semibold text-zinc-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {start.isPending ? "Lancement…" : "Lancer"}
            </button>
            {start.error && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {start.error.message}
              </p>
            )}
          </>
        ) : (
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            En attente de {host?.name ?? "l'hôte"}…
          </p>
        )}
        <button
          type="button"
          disabled={leave.isPending}
          onClick={handleLeave}
          className={secondaryButtonClass}
        >
          Quitter
        </button>
        {leave.error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {leave.error.message}
          </p>
        )}
      </div>
    </div>
  );
}
