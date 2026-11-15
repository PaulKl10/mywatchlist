"use client";

import { useEffect } from "react";
import type { TSwipeDirection } from "./useSwipeGesture";

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/**
 * Flèches gauche / droite = « Non » / « Oui » tant que `enabled` (une carte est jouable).
 * Ignorées en répétition, avec un modificateur, ou pendant la saisie dans un champ.
 */
export function useSwipeKeys(enabled: boolean, fling: (direction: TSwipeDirection) => void): void {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (isEditable(event.target) || isEditable(document.activeElement)) return;
      event.preventDefault();
      fling(event.key === "ArrowRight" ? "right" : "left");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, fling]);
}
