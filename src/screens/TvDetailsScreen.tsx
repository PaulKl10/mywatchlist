import { TvDetailsView } from "@/features/TvDetails/View/TvDetailsView";

interface TvDetailsScreenProps {
  tvId: number;
}

export function TvDetailsScreen({ tvId }: TvDetailsScreenProps) {
  return <TvDetailsView tvId={tvId} />;
}
