export async function sendPushSubscription(subscription: PushSubscriptionJSON): Promise<void> {
  const res = await fetch("/api/me/push-subscriptions", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });
  if (!res.ok) {
    throw new Error(`POST /api/me/push-subscriptions failed with status ${res.status}`);
  }
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const res = await fetch("/api/me/push-subscriptions", {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
  if (!res.ok) {
    throw new Error(`DELETE /api/me/push-subscriptions failed with status ${res.status}`);
  }
}
