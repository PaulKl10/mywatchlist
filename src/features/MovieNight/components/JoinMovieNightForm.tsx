"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CODE_LENGTH } from "@/lib/movie-night/constants";
import { useJoinMovieNightMutation } from "../hooks/useMovieNightMutations";
import { GuestNameField } from "./GuestNameField";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 placeholder-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

interface JoinMovieNightFormProps {
  initialCode: string;
  askName: boolean;
}

export function JoinMovieNightForm({ initialCode, askName }: JoinMovieNightFormProps) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode.slice(0, CODE_LENGTH));
  const [guestName, setGuestName] = useState("");
  const join = useJoinMovieNightMutation();

  const canSubmit =
    code.trim().length === CODE_LENGTH && (!askName || guestName.trim().length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || join.isPending) return;
    join.mutate(
      { code: code.trim().toUpperCase(), guestName: askName ? guestName.trim() : undefined },
      { onSuccess: ({ id }) => router.push(`/ce-soir/${id}`) },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label htmlFor="movie-night-code" className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
          Code
        </label>
        <input
          id="movie-night-code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={CODE_LENGTH}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="K7P2QX"
          className={`${inputClass} font-mono uppercase tracking-widest`}
        />
      </div>
      {askName && <GuestNameField id="movie-night-name" value={guestName} onChange={setGuestName} />}
      {join.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {join.error.message}
        </p>
      )}
      <button
        type="submit"
        disabled={!canSubmit || join.isPending}
        className="rounded-lg bg-amber-500 px-4 py-2.5 text-base font-semibold text-zinc-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {join.isPending ? "Connexion…" : "Rejoindre"}
      </button>
    </form>
  );
}
