import { RatedMoviesView } from "@/features/RatedMovies/View/RatedMoviesView";

export function RatedMoviesScreen() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto py-6">
        <RatedMoviesView />
      </main>
    </div>
  );
}
