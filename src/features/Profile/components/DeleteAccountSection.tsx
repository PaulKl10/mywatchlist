"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ABOUT_ANCHORS, ABOUT_PATH } from "@/lib/legal";
import { useDeleteAccountMutation } from "../hooks/useDeleteAccountMutation";

const CONFIRM_MESSAGE =
  "Vos amis, suggestions, watchlist partagée, temps de visionnage, soirées « Ce soir ? » et notifications seront supprimés définitivement. Votre compte TMDB n'est pas touché.";

export function DeleteAccountSection() {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const deleteAccount = useDeleteAccountMutation();

  // Promesse plutôt qu'un callback de mutate : le profil se démonte dès que la session
  // disparaît, la redirection doit partir quand même.
  const handleConfirm = () => {
    deleteAccount
      .mutateAsync()
      .then(() => router.replace("/"))
      .catch(() => setIsConfirmOpen(false));
  };

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
        <Trash2 className="h-5 w-5" aria-hidden="true" />
        Supprimer mon compte
      </h2>
      <div className="flex flex-col items-start gap-3">
        <p className="text-zinc-600 dark:text-zinc-400">
          Efface définitivement vos données My Watchlist. Votre compte TMDB, sa watchlist et
          ses notes restent sur TMDB.{" "}
          <Link
            href={`${ABOUT_PATH}#${ABOUT_ANCHORS.privacy}`}
            className="font-medium text-amber-600 underline underline-offset-2 hover:text-amber-500 dark:text-amber-500"
          >
            Données concernées
          </Link>
        </p>
        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          disabled={deleteAccount.isPending}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
        >
          Supprimer mon compte
        </button>
        {deleteAccount.isError && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            La suppression a échoué. Réessayez plus tard.
          </p>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="Supprimer votre compte ?"
        message={CONFIRM_MESSAGE}
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={deleteAccount.isPending}
      />
    </section>
  );
}
