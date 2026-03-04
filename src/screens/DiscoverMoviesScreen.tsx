import { DiscoverMoviesView } from "@/features/DiscoverMovies/View/DiscoverMoviesView";

export function DiscoverMoviesScreen() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto py-6">
        <DiscoverMoviesView />
      </main>
    </div>
  );
}