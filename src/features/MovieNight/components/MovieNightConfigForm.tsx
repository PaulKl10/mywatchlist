"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useCreateMovieNightMutation,
} from "../hooks/useMovieNightMutations";
import {
  useMyStreamingProviderIdsQuery,
  useStreamingProvidersQuery,
} from "../hooks/useStreamingProvidersQuery";
import { GenrePicker } from "./GenrePicker";
import { ProviderPicker } from "./ProviderPicker";

const labelClass = "mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function MovieNightConfigForm() {
  const router = useRouter();
  const providersQuery = useStreamingProvidersQuery();
  const myProvidersQuery = useMyStreamingProviderIdsQuery(true);
  const create = useCreateMovieNightMutation();

  // null = pas encore modifié par l'utilisateur : on suit la dernière sélection mémorisée.
  const [pickedProviders, setPickedProviders] = useState<number[] | null>(null);
  const [genreIds, setGenreIds] = useState<number[]>([]);
  const [includeSeen, setIncludeSeen] = useState(false);

  const providers = providersQuery.data ?? [];
  const availableIds = new Set(providers.map((p) => p.id));
  const providerIds =
    pickedProviders ?? (myProvidersQuery.data ?? []).filter((id) => availableIds.has(id));
  const canCreate = providerIds.length > 0 && !create.isPending;

  const submit = (solo: boolean) => {
    if (!canCreate) return;
    create.mutate(
      { providerIds, genreIds, includeSeen },
      { onSuccess: ({ id }) => router.push(`/ce-soir/${id}`) },
    );
  };

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col gap-5"
    >
      <fieldset>
        <legend className={labelClass}>Plateformes</legend>
        {providersQuery.isPending ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Chargement…</p>
        ) : providersQuery.isError ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            Impossible de charger les plateformes.{" "}
            <button type="button" onClick={() => providersQuery.refetch()} className="underline">
              Réessayer
            </button>
          </p>
        ) : (
          <ProviderPicker
            providers={providers}
            selected={providerIds}
            onChange={setPickedProviders}
          />
        )}
      </fieldset>

      <fieldset>
        <legend className={labelClass}>Genres</legend>
        <GenrePicker selected={genreIds} onChange={setGenreIds} />
      </fieldset>

      <div className="flex items-center justify-between gap-3">
        <span id="include-seen-label" className="text-sm text-zinc-700 dark:text-zinc-300">
          Inclure les films déjà vus
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={includeSeen}
          aria-labelledby="include-seen-label"
          onClick={() => setIncludeSeen((v) => !v)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            includeSeen ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-700"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              includeSeen ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>

      {create.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {create.error.message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={!canCreate}
          onClick={() => submit(true)}
          className="rounded-lg bg-amber-500 px-4 py-2.5 text-base font-semibold text-zinc-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Jouer seul
        </button>
        <button
          type="button"
          disabled={!canCreate}
          onClick={() => submit(false)}
          className="rounded-lg border border-amber-500 px-4 py-2.5 text-base font-semibold text-amber-600 transition-colors hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-amber-500"
        >
          Jouer à plusieurs
        </button>
      </div>
    </form>
  );
}
