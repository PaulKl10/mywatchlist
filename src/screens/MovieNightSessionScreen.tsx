import { MovieNightSessionView } from "@/features/MovieNight/View/MovieNightSessionView";

export function MovieNightSessionScreen({ id }: { id: string }) {
  return (
    <div className="min-h-screen overflow-x-clip bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-2xl px-4 py-6">
        <MovieNightSessionView id={id} />
      </main>
    </div>
  );
}
