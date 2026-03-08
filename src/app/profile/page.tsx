import type { Metadata } from "next";
import { ProfileScreen } from "@/screens/ProfileScreen";

export const metadata: Metadata = {
  title: "Mon profil - My Watchlist",
  description: "Mon profil, ma watchlist et mes amis",
};

export default function ProfilePage() {
  return <ProfileScreen />;
}
