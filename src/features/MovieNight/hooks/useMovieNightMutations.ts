import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TMovieNightDecision, TMovieNightState } from "@/lib/movie-night/types";
import {
  castVote,
  createMovieNight,
  decide,
  fetchSoloDeck,
  inviteFriend,
  joinMovieNight,
  leaveMovieNight,
  MovieNightApiError,
  removeParticipant,
  respondToInvite,
  startMovieNight,
  startNewRound,
  type TCreateMovieNightRequest,
  type TSoloDeckRequest,
} from "../services/movie-night.service";
import { isStaleDecisionError } from "../utils/errors";

export function useMovieNightMutations(id: string) {
  const queryClient = useQueryClient();
  const key = ["movie-night", id];
  const setState = async (state: TMovieNightState) => {
    // Un rafraîchissement du polling parti avant l'écriture répondrait après elle et écraserait
    // cet état (le « Match ! » du dernier votant disparaîtrait jusqu'au rafraîchissement suivant).
    await queryClient.cancelQueries({ queryKey: key });
    queryClient.setQueryData(key, state);
  };
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });
  // Décision périmée (un autre a tranché, l'hôte est revenu) : on resynchronise.
  const resyncIfStale = (error: Error) => {
    if (isStaleDecisionError(error)) void invalidate();
  };

  const start = useMutation({ mutationFn: () => startMovieNight(id), onSuccess: setState });

  const vote = useMutation({
    mutationFn: async (v: { movieId: number; liked: boolean }) => {
      try {
        return await castVote(id, v);
      } catch (error) {
        if (error instanceof MovieNightApiError) {
          // Double vote : traité comme un succès, on resynchronise seulement.
          if (error.code === "already_voted") {
            await invalidate();
            return null;
          }
          // Match d'un autre en cours : la carte revient, l'erreur est remontée.
          if (error.code === "match_pending") await invalidate();
        }
        throw error;
      }
    },
    onSuccess: async (state) => {
      if (state) await setState(state);
    },
  });

  const decideMutation = useMutation({
    mutationFn: (decision: TMovieNightDecision) => decide(id, decision),
    onSuccess: setState,
    onError: resyncIfStale,
  });

  const newRound = useMutation({
    mutationFn: () => startNewRound(id),
    onSuccess: setState,
    onError: resyncIfStale,
  });

  const leave = useMutation({
    mutationFn: () => leaveMovieNight(id),
    onSuccess: () => {
      void invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (participantId: string) => removeParticipant(id, participantId),
    onSuccess: setState,
  });

  const invite = useMutation({
    mutationFn: (friendUserId: string) => inviteFriend(id, friendUserId),
    onSuccess: () => {
      void invalidate();
    },
  });

  return { start, vote, decide: decideMutation, newRound, leave, remove, invite };
}

export function useCreateMovieNightMutation() {
  return useMutation({ mutationFn: (input: TCreateMovieNightRequest) => createMovieNight(input) });
}

export function useSoloDeckMutation() {
  return useMutation({ mutationFn: (input: TSoloDeckRequest) => fetchSoloDeck(input) });
}

export function useJoinMovieNightMutation() {
  return useMutation({
    mutationFn: (v: { code: string; guestName?: string }) => joinMovieNight(v.code, v.guestName),
  });
}

export function useRespondToInviteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; accept: boolean }) => respondToInvite(v.id, v.accept),
    // Après un refus aussi (session déjà lancée, pleine, expirée) : l'invitation n'est plus
    // valable, la liste et le compteur sont relus. Le message d'erreur reste affiché.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["movie-night", "invites"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
