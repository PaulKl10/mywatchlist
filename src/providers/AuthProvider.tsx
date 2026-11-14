"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
};

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
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ user: data ?? null, isLoading: isPending, refetch, logout }),
    [data, isPending, refetch, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
