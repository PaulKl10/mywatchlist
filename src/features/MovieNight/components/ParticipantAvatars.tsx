"use client";

import Image from "next/image";
import type { TParticipantView } from "@/lib/movie-night/types";

interface ParticipantAvatarsProps {
  participants: TParticipantView[];
  meParticipantId: string;
}

function statusLabel(participant: TParticipantView, isMe: boolean): string {
  const parts = [participant.name];
  if (isMe) parts.push("vous");
  if (participant.hasFinished) parts.push("a fini la pile");
  if (!participant.isActive) parts.push("inactif");
  return parts.join(", ");
}

/** Anneau ambre = moi, vert = a fini la pile, grisé = inactif. Jamais les votes. */
export function ParticipantAvatars({ participants, meParticipantId }: ParticipantAvatarsProps) {
  return (
    <ul className="flex items-center gap-2" aria-label="Participants">
      {participants.map((participant) => {
        const isMe = participant.id === meParticipantId;
        const ring = isMe
          ? "ring-amber-500"
          : participant.hasFinished
            ? "ring-green-500"
            : "ring-zinc-300 dark:ring-zinc-600";
        const label = statusLabel(participant, isMe);
        return (
          <li
            key={participant.id}
            title={label}
            className={participant.isActive ? undefined : "opacity-40 grayscale"}
          >
            <span className="sr-only">{label}</span>
            <span
              aria-hidden="true"
              className={`flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 ring-2 ring-offset-2 ring-offset-zinc-50 dark:bg-zinc-700 dark:text-zinc-200 dark:ring-offset-zinc-950 ${ring}`}
            >
              {participant.avatarUrl ? (
                <Image
                  src={participant.avatarUrl}
                  alt=""
                  width={28}
                  height={28}
                  unoptimized
                  className="h-7 w-7 object-cover"
                />
              ) : (
                participant.name.trim().charAt(0).toUpperCase() || "?"
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
