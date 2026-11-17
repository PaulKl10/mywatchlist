"use client";

import { useEffect, useId, useRef } from "react";
import { DECLINE_REASONS, type TDeclineReason } from "@/lib/suggestions/declineReasons";

interface DeclineSuggestionModalProps {
  /** Suggestion à refuser ; null : fenêtre fermée. */
  suggestion: { title: string; senderName: string } | null;
  onClose: () => void;
  onDecline: (reason: TDeclineReason) => void;
  isPending: boolean;
  /** Motif en cours d'envoi. */
  pendingReason: TDeclineReason | null;
  error: string | null;
}

/**
 * Refus d'une suggestion : un motif à choisir parmi DECLINE_REASONS, envoyé à son auteur.
 * `<dialog>` natif (fenêtre modale, focus piégé, Échap pour fermer).
 */
export function DeclineSuggestionModal({
  suggestion,
  onClose,
  onDecline,
  isPending,
  pendingReason,
  error,
}: DeclineSuggestionModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const isOpen = suggestion !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(event) => {
        // Échap pendant l'envoi : on attend la réponse.
        if (isPending) event.preventDefault();
      }}
      onClick={(event) => {
        // Clic sur le fond (hors du contenu) : fermeture.
        if (event.target === event.currentTarget && !isPending) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-zinc-900/50 backdrop:backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
    >
      {suggestion && (
        <div className="p-6">
          <h3 id={titleId} className="text-lg font-semibold wrap-anywhere">
            {`Refuser «\u00A0${suggestion.title}\u00A0»\u00A0?`}
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Choisissez un motif : il sera envoyé à {suggestion.senderName}.
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {DECLINE_REASONS.map(({ code, label }) => (
              <li key={code}>
                <button
                  type="button"
                  onClick={() => onDecline(code)}
                  disabled={isPending}
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-left text-sm font-medium text-zinc-800 transition-colors hover:border-amber-500 hover:bg-amber-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:border-amber-500 dark:hover:bg-zinc-800"
                >
                  {pendingReason === code && isPending ? "Envoi…" : label}
                </button>
              </li>
            ))}
          </ul>
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
