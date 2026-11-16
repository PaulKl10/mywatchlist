"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { unsubscribeDevice } from "@/features/Notifications/utils/devicePush";

export type TAccount = {
  id: number;
  username: string;
  name: string | null;
  avatar: { gravatar: { hash: string }; tmdb: { avatar_path: string | null } };
};

type AuthContextValue = {
  user: TAccount | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
  /** Supprime le compte et ses données. Lève si le serveur refuse. */
  deleteAccount: () => Promise<void>;
};

const PUSH_CLEANUP_TIMEOUT_MS = 3000;

/**
 * Désabonne l'appareil des notifications avant la fin de la session (le DELETE serveur doit
 * partir tant qu'elle existe). Une connexion qui se fige ne doit jamais bloquer la suite :
 * l'attente est bornée. `unsubscribeDevice` ne lève jamais.
 */
async function unsubscribeDeviceBounded(): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    unsubscribeDevice(),
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, PUSH_CLEANUP_TIMEOUT_MS);
    }),
  ]);
  clearTimeout(timer);
}

const AUTH_QUERY_KEY = ["auth", "me"] as const;

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchCurrentUser(): Promise<TAccount | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res.ok) {
    throw new Error(`GET /api/auth/me failed with status ${res.status}`);
  }
  const data: { user: TAccount | null } = await res.json();
  return data.user ?? null;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const {
    data,
    isPending,
    refetch: refetchQuery,
  } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchCurrentUser,
    retry: false,
  });

  const refetch = useCallback(async () => {
    await refetchQuery();
  }, [refetchQuery]);

  const logout = useCallback(async () => {
    await unsubscribeDeviceBounded();
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
  }, [queryClient]);

  const deleteAccount = useCallback(async () => {
    await unsubscribeDeviceBounded();
    const res = await fetch("/api/me", {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(`DELETE /api/me failed with status ${res.status}`);
    }
    // Plus aucune donnée de ce compte ne doit rester en cache.
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== AUTH_QUERY_KEY[0],
    });
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ user: data ?? null, isLoading: isPending, refetch, logout, deleteAccount }),
    [data, isPending, refetch, logout, deleteAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
