"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  NOTIFICATION_TARGET_MESSAGE,
  consumeNotificationTarget,
} from "../utils/notificationTarget";

/**
 * Ouvre la page d'une notification touchée (voir `utils/notificationTarget.ts`).
 * La cible est lue au montage (app lancée par la notification), au retour au premier
 * plan (app suspendue, cas de l'iPhone) et à réception du message du service worker.
 */
export function NotificationClickNavigator() {
  const router = useRouter();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let isOpening = false;

    const openTarget = async () => {
      if (isOpening) return;
      isOpening = true;
      try {
        const target = await consumeNotificationTarget();
        const current = window.location.pathname + window.location.search;
        if (target && target !== current) router.push(target);
      } finally {
        isOpening = false;
      }
    };

    const onMessage = (event: MessageEvent) => {
      const data: unknown = event.data;
      if (
        typeof data === "object" &&
        data !== null &&
        (data as { type?: unknown }).type === NOTIFICATION_TARGET_MESSAGE
      ) {
        void openTarget();
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void openTarget();
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    // Les messages arrivés avant l'écouteur ne sont délivrés qu'après startMessages().
    navigator.serviceWorker.startMessages();
    document.addEventListener("visibilitychange", onVisibilityChange);
    void openTarget();

    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router]);

  return null;
}
