import { RatedMediasView } from "@/features/RatedMedias/View/RatedMediasView";

export function RatedMediasScreen() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto py-6">
        <RatedMediasView />
      </main>
    </div>
  );
}
