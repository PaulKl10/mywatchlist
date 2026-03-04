import { Suspense } from "react";
import { DiscoverMoviesScreen } from "@/screens/DiscoverMoviesScreen";

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" />}>
      <DiscoverMoviesScreen />
    </Suspense>
  );
}
