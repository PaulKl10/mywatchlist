import { WatchlistView } from "@/features/Watchlist/View/WatchlistView";

export function WatchlistScreen() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto py-4 md:px-32">
        <WatchlistView />
      </main>
    </div>
  );
}
