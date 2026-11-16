import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/providers/AuthProvider";

/** Supprime le compte My Watchlist (l'AuthProvider vide ensuite la session et le cache). */
export function useDeleteAccountMutation() {
  const { deleteAccount } = useAuth();
  return useMutation({ mutationFn: deleteAccount });
}
