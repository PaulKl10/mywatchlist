import { Header } from "@/components/Header";
import { DiscoverMoviesView } from "@/features/DiscoverMovies/View/DiscoverMoviesView";

export function HomeScreen() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      
      <main className="mx-auto py-8">
        <DiscoverMoviesView />
      </main>
    </div>
  );
}
