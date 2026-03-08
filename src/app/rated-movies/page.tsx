import type { Metadata } from "next";
import { RatedMoviesScreen } from "@/screens/RatedMoviesScreen";

export const metadata: Metadata = {
  title: "Mes films notés - My Watchlist",
  description: "Les films que j'ai notés",
};

export default function RatedMoviesPage() {
  return <RatedMoviesScreen />;
}
