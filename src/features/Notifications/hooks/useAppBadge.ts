"use client";

import { useEffect } from "react";

/**
 * Met à jour la pastille de l'icône PWA (Badging API).
 * Fonctionne sur iOS 16.4+, Chrome/Edge desktop.
 * Sur iOS, la permission doit avoir été accordée via « Activer sur cet appareil »
 * (section Notifications du profil) ; ce hook ne la demande jamais.
 */
export function useAppBadge(count: number) {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("setAppBadge" in navigator)) return;

    const setBadge = async () => {
      try {
        if (count > 0) {
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
