import type { Metadata } from "next";
import { WatchlistScreen } from "@/screens/WatchlistScreen";

export const metadata: Metadata = {
  title: "Ma Watchlist - My Watchlist",
  description: "Ma liste de films à regarder",
};

export default function WatchlistPage() {
  return <WatchlistScreen />;
}
