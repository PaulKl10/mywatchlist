import { MovieNightSoloView } from "@/features/MovieNight/View/MovieNightSoloView";

export function MovieNightSoloScreen() {
  return (
    <div className="min-h-screen overflow-x-clip bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-2xl px-4 py-6">
        <MovieNightSoloView />
      </main>
    </div>
  );
}
