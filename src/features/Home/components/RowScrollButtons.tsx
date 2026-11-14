import { ChevronLeft, ChevronRight } from "lucide-react";

export type TScrollDirection = "left" | "right";

const BUTTON_CLASS =
  "rounded-full bg-zinc-200/80 p-2 text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600";

/**
 * Flèches de défilement d'une rangée (parent avec la classe `group/row`).
 * Visibles au survol de la rangée et au focus clavier ; masquées sur écran
 * tactile, où la rangée défile au doigt.
 */
export function RowScrollButtons({
  onScroll,
}: {
  onScroll: (direction: TScrollDirection) => void;
}) {
  return (
    <div className="flex gap-1 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100 pointer-coarse:hidden">
      <button
        type="button"
        onClick={() => onScroll("left")}
        className={BUTTON_CLASS}
        aria-label="Défiler à gauche"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => onScroll("right")}
        className={BUTTON_CLASS}
        aria-label="Défiler à droite"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
