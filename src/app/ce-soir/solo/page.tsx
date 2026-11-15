import type { Metadata } from "next";
import { MovieNightSoloScreen } from "@/screens/MovieNightSoloScreen";

export const metadata: Metadata = {
  title: "Ce soir ? - My Watchlist",
  description: "Choisissez un film en swipant",
};

export default function MovieNightSoloPage() {
  return <MovieNightSoloScreen />;
}
