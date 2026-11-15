import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TMovieNightDecision, TMovieNightState } from "@/lib/movie-night/types";
import type { TCreateMovieNightInput } from "@/lib/movie-night/validation";
import {
  castVote,
  createMovieNight,
  decide,
  inviteFriend,
  joinMovieNight,
  leaveMovieNight,
  MovieNightApiError,
  removeParticipant,
  respondToInvite,
  startMovieNight,
  startNewRound,
} from "../services/movie-night.service";

export function useMovieNightMutations(id: string) {
  const queryClient = useQueryClient();
  const key = ["movie-night", id];
  const setState = (state: TMovieNightState) => queryClient.setQueryData(key, state);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

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
    onSuccess: (state) => {
      if (state) setState(state);
    },
  });

  const decideMutation = useMutation({
    mutationFn: (decision: TMovieNightDecision) => decide(id, decision),
    onSuccess: setState,
  });

  const newRound = useMutation({ mutationFn: () => startNewRound(id), onSuccess: setState });

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
  return useMutation({ mutationFn: (input: TCreateMovieNightInput) => createMovieNight(input) });
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["movie-night", "invites"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
    },
  });
}
