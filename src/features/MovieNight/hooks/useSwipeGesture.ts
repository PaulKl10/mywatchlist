"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { resolveSwipe } from "../utils/swipe";

export type TSwipeDirection = "left" | "right";
type TPointerHandler = (event: ReactPointerEvent<HTMLElement>) => void;
export type TSwipeBind = {
  onPointerDown: TPointerHandler;
  onPointerMove: TPointerHandler;
  onPointerUp: TPointerHandler;
  onPointerCancel: TPointerHandler;
};

/** En deçà de ce déplacement, un appui est un toucher, pas un glissement. */
export const TAP_SLOP_PX = 10;
/** Décalage donné à la carte lancée : au-delà, elle est en train de sortir. */
export const SWIPE_EXIT_OFFSET = 600;
/** Durée de la transition CSS de sortie et de retour en place. */
export const SWIPE_EXIT_MS = 250;
/**
 * Après un lancement, boutons, flèches et glissements sont ignorés le temps de la sortie puis de
 * la montée de la carte suivante (même durée de transition) : un double toucher, même à 300 ms,
 * ne vote pas la carte qui arrive.
 */
const SWIPE_LOCK_MS = SWIPE_EXIT_MS * 2;
/** Seuls les mouvements de cette fenêtre comptent pour la vitesse. */
const VELOCITY_WINDOW_MS = 100;
/** Fenêtre trop courte : vitesse non significative (gigue au relâché). */
const MIN_VELOCITY_SPAN_MS = 16;

type TSample = { x: number; t: number };
type TActivePointer = {
  id: number;
  startX: number;
  startY: number;
  dragging: boolean;
  samples: TSample[];
};

function recentVelocity(samples: TSample[], x: number, t: number): number {
  const first = samples.find((sample) => t - sample.t <= VELOCITY_WINDOW_MS);
  if (!first || t - first.t < MIN_VELOCITY_SPAN_MS) return 0;
  return (x - first.x) / (t - first.t);
}

export function useSwipeGesture(onSwipe: (direction: TSwipeDirection) => void): {
  offsetX: number;
  isDragging: boolean;
  bind: TSwipeBind;
  fling: (direction: TSwipeDirection) => void;
  reset: () => void;
} {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const onSwipeRef = useRef(onSwipe);
  const pointer = useRef<TActivePointer | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Seule source de vérité du verrou (horodatage performance.now()), remis à zéro par reset().
  const lockedUntil = useRef(0);

  useLayoutEffect(() => {
    onSwipeRef.current = onSwipe;
  });

  useEffect(() => {
    return () => {
      if (exitTimer.current !== null) clearTimeout(exitTimer.current);
    };
  }, []);

  const fling = useCallback((direction: TSwipeDirection) => {
    // Sortie ou montée de la carte suivante en cours : un double toucher ne vote qu'une fois.
    if (performance.now() < lockedUntil.current) return;
    lockedUntil.current = performance.now() + SWIPE_LOCK_MS;
    pointer.current = null;
    setIsDragging(false);
    setOffsetX(direction === "right" ? SWIPE_EXIT_OFFSET : -SWIPE_EXIT_OFFSET);
    // Callback figé au lancement : il vise la carte lancée, même si la pile change pendant la sortie.
    const callback = onSwipeRef.current;
    exitTimer.current = setTimeout(() => {
      exitTimer.current = null;
      setOffsetX(0);
      callback(direction);
    }, SWIPE_EXIT_MS);
  }, []);

  const reset = useCallback(() => {
    if (exitTimer.current !== null) {
      clearTimeout(exitTimer.current);
      exitTimer.current = null;
    }
    lockedUntil.current = 0;
    pointer.current = null;
    setIsDragging(false);
    setOffsetX(0);
  }, []);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (performance.now() < lockedUntil.current || pointer.current !== null) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointeur déjà relâché : les événements suivants restent gérés par la carte.
    }
    pointer.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
      samples: [{ x: event.clientX, t: event.timeStamp }],
    };
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const active = pointer.current;
    if (!active || active.id !== event.pointerId) return;
    const dx = event.clientX - active.startX;
    if (!active.dragging) {
      if (Math.hypot(dx, event.clientY - active.startY) < TAP_SLOP_PX) return;
      active.dragging = true;
      setIsDragging(true);
    }
    active.samples.push({ x: event.clientX, t: event.timeStamp });
    active.samples = active.samples.filter((s) => event.timeStamp - s.t <= VELOCITY_WINDOW_MS);
    setOffsetX(dx);
  }, []);

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const active = pointer.current;
      if (!active || active.id !== event.pointerId) return;
      pointer.current = null;
      if (!active.dragging) return; // simple toucher
      const dx = event.clientX - active.startX;
      const velocity = recentVelocity(active.samples, event.clientX, event.timeStamp);
      const direction = resolveSwipe(dx, velocity);
      if (direction) {
        fling(direction);
        return;
      }
      setIsDragging(false);
      setOffsetX(0);
    },
    [fling],
  );

  const onPointerCancel = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const active = pointer.current;
    if (!active || active.id !== event.pointerId) return;
    pointer.current = null;
    setIsDragging(false);
    setOffsetX(0);
  }, []);

  return {
    offsetX,
    isDragging,
    bind: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
    fling,
    reset,
  };
}
