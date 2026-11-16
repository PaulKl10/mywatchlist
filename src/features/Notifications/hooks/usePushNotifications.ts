"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readDevicePush, subscribeDevice } from "../utils/devicePush";
import type { TPushUiState } from "../utils/pushSupport";
import {
  removePushSubscription,
  sendPushSubscription,
} from "../services/push-subscriptions.service";

export function usePushNotifications(): {
  state: TPushUiState | "loading";
  isWorking: boolean;
  error: string | null;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
} {
  const [state, setState] = useState<TPushUiState | "loading">("loading");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<PushSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;
    readDevicePush().then(({ state: next, subscription }) => {
      if (cancelled) return;
      subscriptionRef.current = subscription;
      setState(next);
      // Renvoie l'abonnement local pour qu'il suive le compte connecté (idempotent).
      if (subscription) {
        sendPushSubscription(subscription.toJSON()).catch(() => {});
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async () => {
    setIsWorking(true);
    setError(null);
    try {
      const subscription = await subscribeDevice();
      subscriptionRef.current = subscription;
      try {
        await sendPushSubscription(subscription.toJSON());
      } catch (e) {
        // Sans enregistrement serveur, l'appareil ne recevrait rien : on annule.
        await subscription.unsubscribe().catch(() => {});
        subscriptionRef.current = null;
        throw e;
      }
      setState("on");
    } catch (e) {
      if (e instanceof Error && e.message === "permission_denied") {
        // Refus définitif seulement ; une demande simplement fermée reste réessayable.
        if (Notification.permission === "denied") {
          setState("denied");
        } else {
          setState("off");
          setError("Notifications non autorisées. Réessayez.");
        }
      } else {
        setError("Impossible d'activer les notifications. Réessayez.");
      }
    } finally {
      setIsWorking(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setIsWorking(true);
    setError(null);
    try {
      const subscription = subscriptionRef.current;
      if (subscription) {
        await removePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      subscriptionRef.current = null;
      setState("off");
    } catch {
      setError("Impossible de désactiver les notifications. Réessayez.");
    } finally {
      setIsWorking(false);
    }
  }, []);

  return { state, isWorking, error, enable, disable };
}
