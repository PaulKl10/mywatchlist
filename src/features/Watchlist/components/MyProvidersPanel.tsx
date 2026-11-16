"use client";

import { useState } from "react";
import { JustWatchAttribution } from "@/components/JustWatchAttribution";
import { ProviderPicker } from "@/features/MovieNight/components/ProviderPicker";
import { useStreamingProvidersQuery } from "@/features/MovieNight/hooks/useStreamingProvidersQuery";
import { useSaveMyStreamingProvidersMutation } from "../hooks/useGetWatchlistQuery";

interface MyProvidersPanelProps {
  /** Plateformes déjà enregistrées, pré-cochées. */
  initialIds: number[];
  /** Appelé après l'enregistrement, ou à l'annulation. */
  onDone: () => void;
  /** Sans plateformes enregistrées, il n'y a rien à quoi revenir : pas de bouton Annuler. */
  canCancel: boolean;
}

/** Choix de « mes plateformes », partagées entre le filtre de la watchlist et « Ce soir ? ». */
export function MyProvidersPanel({ initialIds, onDone, canCancel }: MyProvidersPanelProps) {
  const providersQuery = useStreamingProvidersQuery();
  const save = useSaveMyStreamingProvidersMutation();
  const [picked, setPicked] = useState(initialIds);

  const handleSave = () => {
    save.mutate(picked, { onSuccess: onDone });
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Mes plateformes</h3>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Coche tes abonnements. Ils servent aussi à pré-remplir « Ce soir ? ».
      </p>

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
          <ProviderPicker providers={providersQuery.data} selected={picked} onChange={setPicked} />
          <JustWatchAttribution className="mt-3" />
        </>
      )}

      {save.isError && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          Enregistrement impossible. Réessaie.
        </p>
      )}

      <div className="mt-4 flex justify-end gap-3">
        {canCancel && (
          <button
            type="button"
            onClick={onDone}
            disabled={save.isPending}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Annuler
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={picked.length === 0 || save.isPending}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
        >
          {save.isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </section>
  );
}
