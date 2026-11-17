import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  applyReactionChange,
  type TReaction,
  type TReactionCounts,
} from "@/lib/activity/reactions";
import type { TActivityItem } from "@/types/activity.type";
import { FRIENDS_ACTIVITY_KEY, type TFriendsActivity } from "./useFriendsActivityQuery";

type TReactionInput = { activityId: string; reaction: TReaction | null };
type TReactionResult = { reaction: TReaction | null; counts: TReactionCounts };

async function setActivityReaction({ activityId, reaction }: TReactionInput): Promise<TReactionResult> {
  const res = await fetch(`/api/friends/activity/${encodeURIComponent(activityId)}/reaction`, {
    method: reaction ? "PUT" : "DELETE",
    credentials: "include",
    ...(reaction && {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reaction }),
    }),
  });
  if (!res.ok) throw new Error(`Reaction failed with status ${res.status}`);
  return res.json();
}

function patchItem(
  data: TFriendsActivity | undefined,
  activityId: string,
  patch: (item: TActivityItem) => Partial<TActivityItem>
): TFriendsActivity | undefined {
  if (!data) return data;
  return {
    ...data,
    items: data.items.map((item) => (item.id === activityId ? { ...item, ...patch(item) } : item)),
  };
}

/** Réaction à un événement du fil, affichée tout de suite et annulée en cas d'échec. */
export function useActivityReactionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setActivityReaction,
    onMutate: async ({ activityId, reaction }) => {
      await queryClient.cancelQueries({ queryKey: FRIENDS_ACTIVITY_KEY });
      const previous = queryClient.getQueryData<TFriendsActivity>(FRIENDS_ACTIVITY_KEY);
      queryClient.setQueryData<TFriendsActivity>(FRIENDS_ACTIVITY_KEY, (data) =>
        patchItem(data, activityId, (item) => ({
          myReaction: reaction,
          reactions: applyReactionChange(item.reactions, item.myReaction, reaction),
        }))
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(FRIENDS_ACTIVITY_KEY, context.previous);
    },
    onSuccess: (result, { activityId }) => {
      queryClient.setQueryData<TFriendsActivity>(FRIENDS_ACTIVITY_KEY, (data) =>
        patchItem(data, activityId, () => ({ myReaction: result.reaction, reactions: result.counts }))
      );
    },
  });
}
