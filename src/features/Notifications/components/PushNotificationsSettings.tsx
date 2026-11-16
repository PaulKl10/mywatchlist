"use client";

import { Bell } from "lucide-react";
import { usePushNotifications } from "../hooks/usePushNotifications";

const INFO_MESSAGES = {
  unsupported: "Les notifications ne sont pas disponibles sur ce navigateur.",
  needs_install:
    "Pour recevoir les notifications, ajoutez My Watchlist à l'écran d'accueil (Partager → Sur l'écran d'accueil), puis ouvrez-la depuis l'icône.",
  no_service_worker: "Les notifications ne sont disponibles que dans l'app en ligne.",
  denied:
    "Notifications bloquées. Autorisez-les dans les réglages du navigateur pour cette app.",
} as const;

export function PushNotificationsSettings() {
  const { state, isWorking, error, enable, disable } = usePushNotifications();

  if (state === "loading") return null;

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
        <Bell className="h-5 w-5" />
        Notifications
      </h2>
      <div className="flex flex-col items-start gap-3">
        {state === "off" && (
          <button
            type="button"
            onClick={enable}
            disabled={isWorking}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
          >
            Activer sur cet appareil
          </button>
        )}
        {state === "on" && (
          <>
            <p className="text-zinc-600 dark:text-zinc-400">Activées sur cet appareil</p>
            <button
              type="button"
              onClick={disable}
              disabled={isWorking}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Désactiver
            </button>
          </>
        )}
        {state !== "off" && state !== "on" && (
          <p className="text-zinc-600 dark:text-zinc-400">{INFO_MESSAGES[state]}</p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
