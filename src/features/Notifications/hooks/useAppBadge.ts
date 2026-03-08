"use client";

import { useEffect } from "react";

/**
 * Met à jour la pastille de l'icône PWA (Badging API).
 * Fonctionne sur iOS 16.4+, Chrome/Edge desktop.
 * Sur iOS, nécessite Notification.requestPermission().
 */
export function useAppBadge(count: number) {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("setAppBadge" in navigator)) return;

    const setBadge = async () => {
      try {
        if (count > 0) {
          if (typeof Notification !== "undefined" && Notification.permission === "default") {
            await Notification.requestPermission();
          }
          await (navigator as Navigator & { setAppBadge: (count?: number) => Promise<void> }).setAppBadge(count);
        } else {
          await (navigator as Navigator & { clearAppBadge: () => Promise<void> }).clearAppBadge?.();
        }
      } catch {
        // API non supportée ou permission refusée
      }
    };

    setBadge();

    return () => {
      if (count > 0) {
        (navigator as Navigator & { clearAppBadge?: () => Promise<void> }).clearAppBadge?.().catch(() => {});
      }
    };
  }, [count]);
}
