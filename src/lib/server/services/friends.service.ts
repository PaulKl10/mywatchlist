import { prisma } from "@/lib/prisma";

export type TFriend = {
  id: string;
  tmdb_id: number;
  username: string | null;
  gravatar_hash: string | null;
  tmdb_avatar_path: string | null;
};

export async function getFriends(
  sessionId: string | undefined
): Promise<TFriend[]> {
  if (!sessionId) return [];

  const session = await prisma.session.findUnique({
    where: { tmdb_session_id: sessionId },
    include: { user: true },
  });

  if (!session?.user) return [];

  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: session.user.id },
        { receiverId: session.user.id },
      ],
    },
    include: {
      sender: true,
      receiver: true,
    },
  });

  return friendships.map((f) => {
    const friend = f.senderId === session.user!.id ? f.receiver : f.sender;
    return {
      id: friend.id,
      tmdb_id: friend.tmdb_id,
      username: friend.username,
      gravatar_hash: friend.gravatar_hash,
      tmdb_avatar_path: friend.tmdb_avatar_path,
    } satisfies TFriend;
  });
}

export async function addFriend(
  sessionId: string | undefined,
  receiverTmdbId: number
): Promise<
  | { success: true }
  | { error: "unauthorized" }
  | { error: "user_not_found" }
  | { error: "cannot_add_self" }
  | { error: "request_already_sent" }
  | { error: "they_sent_you_request" }
  | { error: "already_friends" }
> {
  if (!sessionId) return { error: "unauthorized" };

  const session = await prisma.session.findUnique({
    where: { tmdb_session_id: sessionId },
    include: { user: true },
  });

  if (!session?.user) return { error: "unauthorized" };

  const receiver = await prisma.user.findUnique({
    where: { tmdb_id: receiverTmdbId },
  });

  if (!receiver) return { error: "user_not_found" };
  if (receiver.id === session.user.id) return { error: "cannot_add_self" };

  const existing = await prisma.friendship.findUnique({
    where: {
      senderId_receiverId: {
        senderId: session.user.id,
        receiverId: receiver.id,
      },
    },
  });

  if (existing) {
    return {
      error:
        existing.status === "PENDING" ? "request_already_sent" : "already_friends",
    };
  }

  const reverseExisting = await prisma.friendship.findUnique({
    where: {
      senderId_receiverId: {
        senderId: receiver.id,
        receiverId: session.user.id,
      },
    },
  });

  if (reverseExisting) {
    return {
      error:
        reverseExisting.status === "PENDING"
          ? "they_sent_you_request"
          : "already_friends",
    };
  }

  await prisma.friendship.create({
    data: {
      senderId: session.user.id,
      receiverId: receiver.id,
      status: "PENDING",
    },
  });

  return { success: true };
}
