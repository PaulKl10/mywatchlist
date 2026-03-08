import type { Metadata } from "next";
import { Suspense } from "react";
import { DiscoverMoviesScreen } from "@/screens/DiscoverMoviesScreen";

export const metadata: Metadata = {
  title: "Explorer - My Watchlist",
  description: "Découvrez des films",
};

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" />}>
      <DiscoverMoviesScreen />
    </Suspense>
  );
}
