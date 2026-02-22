import { DiscoverMoviesView } from "@/features/DiscoverMovies/View/DiscoverMoviesView";

export function HomeScreen() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="px-2 md:px-32 border-b border-zinc-200 bg-white py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          My Watchlist
        </h1>
      </header>
      <main className="mx-auto px-8 md:px-32 py-8">
        <DiscoverMoviesView />
      </main>
    </div>
  );
}
