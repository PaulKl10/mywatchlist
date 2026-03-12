import type { Metadata } from "next";
import { RatedMediasScreen } from "@/screens/RatedMediasScreen";

export const metadata: Metadata = {
  title: "Mes notes - My Watchlist",
  description: "Les films et séries que j'ai notés",
};

export default function RatedMoviesPage() {
  return <RatedMediasScreen />;
}
