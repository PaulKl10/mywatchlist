import { HomeView } from "@/features/Home/View/HomeView";

export function HomeScreen() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto py-6">
        <HomeView />
      </main>
    </div>
  );
}
