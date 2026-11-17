"use client";

import { useEffect } from "react";

/**
 * Fait défiler jusqu'à la section `id` quand l'URL se termine par `#id` (lien d'une
 * notification) et que la section vient d'apparaître : chargée après la navigation, elle
 * n'existait pas encore quand le routeur a cherché l'ancre.
 */
export function useScrollToHash(id: string, isRendered: boolean) {
  useEffect(() => {
    if (!isRendered || window.location.hash !== `#${id}`) return;
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [id, isRendered]);
}
