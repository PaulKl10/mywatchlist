import type { Metadata } from "next";
import { BilanScreen } from "@/screens/BilanScreen";

export const metadata: Metadata = {
  title: "Mon bilan - My Watchlist",
  description: "Tes films et séries notés, tes genres préférés et ton temps devant l'écran",
};

export default function BilanPage() {
  return <BilanScreen />;
}
