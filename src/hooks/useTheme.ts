"use client";

import { useEffect, useState } from "react";

/**
 * Détecte si le thème sombre est actif (préférence système via prefers-color-scheme).
 * Cohérent avec globals.css qui utilise @media (prefers-color-scheme: dark).
 */
export function useTheme(): boolean {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return isDarkMode;
}
