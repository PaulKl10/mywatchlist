import { Header } from "@/components/Header";
import { DiscoverMoviesView } from "@/features/DiscoverMovies/View/DiscoverMoviesView";

export function HomeScreen() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header title="My Watchlist" />
      <main className="mx-auto px-4 py-8 md:px-32">
        <DiscoverMoviesView />
      </main>
    </div>
  );
}
