import type { Metadata } from "next";
import { ActivityScreen } from "@/screens/ActivityScreen";

export const metadata: Metadata = {
  title: "Activité des amis - My Watchlist",
  description: "Ce que tes amis notent et ajoutent à leur watchlist",
};

export default function ActivityPage() {
  return <ActivityScreen />;
}
