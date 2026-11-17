import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FRIENDS_ACTIVITY_KEY, type TFriendsActivity } from "./useFriendsActivityQuery";

type TLikeInput = { activityId: string; liked: boolean };
type TLikeResult = { liked: boolean; likeCount: number };

async function setActivityLike({ activityId, liked }: TLikeInput): Promise<TLikeResult> {
  const res = await fetch(`/api/friends/activity/${encodeURIComponent(activityId)}/like`, {
    method: liked ? "PUT" : "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Like failed with status ${res.status}`);
  return res.json();
}

function patchItem(
  data: TFriendsActivity | undefined,
  activityId: string,
  patch: (item: TFriendsActivity["items"][number]) => Partial<TFriendsActivity["items"][number]>
): TFriendsActivity | undefined {
  if (!data) return data;
  return {
    ...data,
    items: data.items.map((item) => (item.id === activityId ? { ...item, ...patch(item) } : item)),
  };
}

/** « J'aime » sur un événement du fil, affiché tout de suite et annulé en cas d'échec. */
export function useActivityLikeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setActivityLike,
    onMutate: async ({ activityId, liked }) => {
      await queryClient.cancelQueries({ queryKey: FRIENDS_ACTIVITY_KEY });
      const previous = queryClient.getQueryData<TFriendsActivity>(FRIENDS_ACTIVITY_KEY);
      queryClient.setQueryData<TFriendsActivity>(FRIENDS_ACTIVITY_KEY, (data) =>
        patchItem(data, activityId, (item) => ({
          likedByMe: liked,
          likeCount: Math.max(0, item.likeCount + (liked === item.likedByMe ? 0 : liked ? 1 : -1)),
        }))
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(FRIENDS_ACTIVITY_KEY, context.previous);
    },
    onSuccess: (result, { activityId }) => {
      queryClient.setQueryData<TFriendsActivity>(FRIENDS_ACTIVITY_KEY, (data) =>
        patchItem(data, activityId, () => ({ likedByMe: result.liked, likeCount: result.likeCount }))
      );
    },
  });
}
