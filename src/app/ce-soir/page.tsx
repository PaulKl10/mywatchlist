import type { Metadata } from "next";
import { Suspense } from "react";
import { MovieNightScreen } from "@/screens/MovieNightScreen";

export const metadata: Metadata = {
  title: "Ce soir ? - My Watchlist",
  description: "Choisissez un film à plusieurs en swipant",
};

export default function MovieNightPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" />}>
      <MovieNightScreen />
    </Suspense>
  );
}
