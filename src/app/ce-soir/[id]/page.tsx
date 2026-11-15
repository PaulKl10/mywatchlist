import type { Metadata } from "next";
import { MovieNightSessionScreen } from "@/screens/MovieNightSessionScreen";

export const metadata: Metadata = {
  title: "Ce soir ? - My Watchlist",
  description: "Choisissez un film à plusieurs en swipant",
};

export default async function MovieNightSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MovieNightSessionScreen id={id} />;
}
