import type { Metadata } from "next";
import { PersonMovieCreditsScreen } from "@/screens/PersonMovieCreditsScreen";

interface PersonPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Filmographie - My Watchlist",
  };
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params;
  const personId = parseInt(id, 10);

  if (Number.isNaN(personId)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="text-zinc-600 dark:text-zinc-400">
          ID invalide
        </p>
      </div>
    );
  }

  return <PersonMovieCreditsScreen personId={personId} />;
}
