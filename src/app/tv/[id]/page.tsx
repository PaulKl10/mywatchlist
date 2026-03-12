import type { Metadata } from "next";
import { TvDetailsScreen } from "@/screens/TvDetailsScreen";

interface TvPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TvPageProps): Promise<Metadata> {
  return {
    title: `Série - My Watchlist`,
  };
}

export default async function TvPage({ params }: TvPageProps) {
  const { id } = await params;
  const tvId = parseInt(id, 10);

  if (Number.isNaN(tvId)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="text-zinc-600 dark:text-zinc-400">
          ID de série invalide
        </p>
      </div>
    );
  }

  return <TvDetailsScreen tvId={tvId} />;
}
