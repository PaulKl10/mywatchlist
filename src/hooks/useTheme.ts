"use client";

import { useSyncExternalStore } from "react";

const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

function subscribe(onChange: () => void): () => void {
  const mediaQuery = window.matchMedia(DARK_SCHEME_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(DARK_SCHEME_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Détecte si le thème sombre est actif (préférence système via prefers-color-scheme).
 * Cohérent avec globals.css qui utilise @media (prefers-color-scheme: dark).
 */
export function useTheme(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
