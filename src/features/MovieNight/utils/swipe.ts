import type { TDeckMovie } from "@/lib/movie-night/types";

export const SWIPE_DISTANCE_THRESHOLD = 100; // px
export const SWIPE_VELOCITY_THRESHOLD = 0.5; // px/ms

export function resolveSwipe(dx: number, velocityX: number): "left" | "right" | null {
  if (dx === 0 && velocityX === 0) return null;
  if (Math.abs(dx) >= SWIPE_DISTANCE_THRESHOLD) return dx > 0 ? "right" : "left";
  if (Math.abs(velocityX) >= SWIPE_VELOCITY_THRESHOLD && dx !== 0 && Math.sign(dx) === Math.sign(velocityX)) {
    return dx > 0 ? "right" : "left";
  }
  return null;
}

export function firstUnvotedIndex(deck: TDeckMovie[], myVotes: Record<number, boolean>): number {
  const index = deck.findIndex((movie) => !(movie.id in myVotes));
  return index === -1 ? deck.length : index;
}
