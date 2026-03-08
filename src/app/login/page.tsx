import type { Metadata } from "next";
import { LoginScreen } from "@/screens/LoginScreen";

export const metadata: Metadata = {
  title: "Connexion - My Watchlist",
  description: "Connectez-vous avec votre compte TMDB",
};

export default function LoginPage() {
  return <LoginScreen />;
}
