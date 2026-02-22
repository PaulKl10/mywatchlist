import { Header } from "@/components/Header";
import { MovieDetailsView } from "@/features/MovieDetails/View/MovieDetailsView";

interface MovieDetailsScreenProps {
  movieId: number;
}

export function MovieDetailsScreen({ movieId }: MovieDetailsScreenProps) {
  return <MovieDetailsView movieId={movieId} />;
}
