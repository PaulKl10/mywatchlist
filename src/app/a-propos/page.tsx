import type { Metadata } from "next";
import { AboutScreen } from "@/screens/AboutScreen";

export const metadata: Metadata = {
  title: "À propos - My Watchlist",
  description: "Crédits, mentions légales et politique de confidentialité",
};

export default function AboutPage() {
  return <AboutScreen />;
}
