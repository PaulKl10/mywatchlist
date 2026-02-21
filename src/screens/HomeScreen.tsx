import { DiscoverMoviesView } from "@/features/DiscoverMovies/View/DiscoverMoviesView";

export function HomeScreen() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Films à découvrir
        </h1>
      </header>
      <main className="mx-auto max-w-7xl px-2 py-8">
        <DiscoverMoviesView />
      </main>
    </div>
  );
}
