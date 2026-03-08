import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion - My Watchlist",
};

export default function LoginCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
