import { MovieNightHomeView } from "@/features/MovieNight/View/MovieNightHomeView";

export function MovieNightScreen() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-2xl px-4 py-6">
        <MovieNightHomeView />
      </main>
    </div>
  );
}
