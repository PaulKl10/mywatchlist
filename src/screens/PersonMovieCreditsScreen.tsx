import { PersonMovieCreditsView } from "@/features/PersonMovieCredits/View/PersonMovieCreditsView";

interface PersonMovieCreditsScreenProps {
  personId: number;
}

export function PersonMovieCreditsScreen({
  personId,
}: PersonMovieCreditsScreenProps) {
  return <PersonMovieCreditsView personId={personId} />;
}
