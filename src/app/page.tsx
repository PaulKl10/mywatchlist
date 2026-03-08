import type { Metadata } from "next";
import { HomeScreen } from "@/screens/HomeScreen";

export const metadata: Metadata = {
  title: "My Watchlist",
  description: "Ma liste de films à regarder",
};

export default function Home() {
  return <HomeScreen />;
}
