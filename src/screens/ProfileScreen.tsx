import { ProfileView } from "@/features/Profile/View/ProfileView";

export function ProfileScreen() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto py-8">
        <ProfileView />
      </main>
    </div>
  );
}
