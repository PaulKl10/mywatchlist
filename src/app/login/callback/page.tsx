"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginCallbackPage() {
  const router = useRouter();
  const { refetch } = useAuth();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    const createSession = async () => {
      try {
        const res = await fetch("/api/auth/session", {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Session creation failed");
        }

        await refetch();
        router.replace("/");
      } catch {
        setStatus("error");
        setTimeout(() => router.replace("/login?error=session"), 2000);
      }
    };

    createSession();
  }, [router, refetch]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950">
      {status === "loading" ? (
        <>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-600 dark:border-t-zinc-300" />
          <p className="text-zinc-600 dark:text-zinc-400">
            Connexion en cours...
          </p>
        </>
      ) : (
        <p className="text-red-600 dark:text-red-400">
          Erreur de connexion. Redirection...
        </p>
      )}
    </div>
  );
}
