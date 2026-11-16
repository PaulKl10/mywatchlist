"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TMovieNightSettings } from "@/lib/movie-night/types";
import { parseGuestName } from "@/lib/movie-night/validation";
import {
  useCreateMovieNightMutation,
  useSoloDeckMutation,
} from "../hooks/useMovieNightMutations";
import {
  useMyStreamingProviderIdsQuery,
  useStreamingProvidersQuery,
} from "../hooks/useStreamingProvidersQuery";
import { loadRememberedProviderIds, saveRememberedProviderIds } from "../utils/rememberedProviders";
import { saveSoloGame, startSoloGame } from "../utils/soloGame";
import { GuestNameField } from "./GuestNameField";
import { GenrePicker } from "./GenrePicker";
import { ProviderPicker } from "./ProviderPicker";
import { JustWatchAttribution } from "@/components/JustWatchAttribution";

const labelClass = "mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function MovieNightConfigForm({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const providersQuery = useStreamingProvidersQuery();
  const myProvidersQuery = useMyStreamingProviderIdsQuery(isLoggedIn);
  const create = useCreateMovieNightMutation();
  const soloDeck = useSoloDeckMutation();

  // null = pas encore modifié par l'utilisateur : on suit la dernière sélection mémorisée.
  const [pickedProviders, setPickedProviders] = useState<number[] | null>(null);
  const [genreIds, setGenreIds] = useState<number[]>([]);
  const [includeSeen, setIncludeSeen] = useState(false);
  // Sans compte : plateformes mémorisées dans le navigateur (le formulaire n'est rendu qu'après
  // la résolution de l'auth, donc jamais côté serveur) et pseudo de l'hôte.
  const [rememberedIds] = useState(() => (isLoggedIn ? [] : loadRememberedProviderIds()));
  const [guestName, setGuestName] = useState("");

  const providers = providersQuery.data ?? [];
  const availableIds = new Set(providers.map((p) => p.id));
  const providerIds =
    pickedProviders ??
    (isLoggedIn ? (myProvidersQuery.data ?? []) : rememberedIds).filter((id) => availableIds.has(id));
  const canCreate = providerIds.length > 0 && !create.isPending && !soloDeck.isPending;
  const guestNameValid = isLoggedIn || parseGuestName(guestName) !== null;
  const error = soloDeck.error ?? create.error;

  // Solo : une requête construit la pile, puis la partie se joue dans le navigateur.
  const playSolo = () => {
    if (!canCreate) return;
    const settings: TMovieNightSettings = {
      providerIds,
      genreIds,
      includeSeen: isLoggedIn && includeSeen,
    };
    if (!isLoggedIn) saveRememberedProviderIds(providerIds);
    create.reset();
    soloDeck.mutate(settings, {
      onSuccess: ({ deck }) => {
        saveSoloGame(startSoloGame(settings, deck));
        router.push("/ce-soir/solo");
      },
    });
  };

  const playTogether = () => {
    if (!canCreate || !guestNameValid) return;
    if (!isLoggedIn) saveRememberedProviderIds(providerIds);
    soloDeck.reset();
    create.mutate(
      isLoggedIn
        ? { providerIds, genreIds, includeSeen }
        : { providerIds, genreIds, includeSeen: false, guestName: guestName.trim() },
      { onSuccess: ({ id }) => router.push(`/ce-soir/${id}`) },
    );
  };

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col gap-5"
    >
      {!isLoggedIn && (
        <GuestNameField
          id="movie-night-host-name"
          value={guestName}
          onChange={setGuestName}
          hint="Pour jouer à plusieurs"
        />
      )}

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
          <>
            <ProviderPicker
              providers={providers}
              selected={providerIds}
              onChange={setPickedProviders}
            />
            <JustWatchAttribution className="mt-3" />
          </>
        )}
      </fieldset>

      <fieldset>
        <legend className={labelClass}>Genres</legend>
        <GenrePicker selected={genreIds} onChange={setGenreIds} />
      </fieldset>

      {isLoggedIn && (
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
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error.message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={!canCreate}
          onClick={playSolo}
          className="rounded-lg bg-amber-500 px-4 py-2.5 text-base font-semibold text-zinc-900 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {soloDeck.isPending ? "Préparation…" : "Jouer seul"}
        </button>
        <button
          type="button"
          disabled={!canCreate || !guestNameValid}
          onClick={playTogether}
          className="rounded-lg border border-amber-500 px-4 py-2.5 text-base font-semibold text-amber-600 transition-colors hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-amber-500"
        >
          Jouer à plusieurs
        </button>
      </div>
    </form>
  );
}
