import { MovieDetailsScreen } from "@/screens/MovieDetailsScreen";

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params;
  const movieId = parseInt(id, 10);

  if (Number.isNaN(movieId)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="text-zinc-600 dark:text-zinc-400">
          ID de film invalide
        </p>
      </div>
    );
  }

  return <MovieDetailsScreen movieId={movieId} />;
}
