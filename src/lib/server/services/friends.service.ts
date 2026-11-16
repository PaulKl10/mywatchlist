import type { Friendship } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type TFriend = {
  id: string;
  tmdb_id: number;
  username: string | null;
  gravatar_hash: string | null;
  tmdb_avatar_path: string | null;
};

function acceptedFriendshipsOf(userId: string) {
  return {
    status: "ACCEPTED",
    OR: [{ senderId: userId }, { receiverId: userId }],
  };
}

/** Amitié acceptée entre deux utilisateurs, quel que soit celui qui a envoyé la demande. */
export async function findAcceptedFriendship(
  userId: string,
  otherUserId: string
): Promise<Friendship | null> {
  return prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    },
  });
}

/** IDs internes des amis (amitiés acceptées) d'un utilisateur. */
export async function getFriendIds(userId: string): Promise<string[]> {
  const friendships = await prisma.friendship.findMany({
    where: acceptedFriendshipsOf(userId),
    select: { senderId: true, receiverId: true },
  });

  return friendships.map((f) =>
    f.senderId === userId ? f.receiverId : f.senderId
  );
}

export async function getFriends(userId: string): Promise<TFriend[]> {
  const friendships = await prisma.friendship.findMany({
    where: acceptedFriendshipsOf(userId),
    include: {
      sender: true,
      receiver: true,
    },
  });

  return friendships.map((f) => {
    const friend = f.senderId === userId ? f.receiver : f.sender;
    return {
      id: friend.id,
      tmdb_id: friend.tmdb_id,
      username: friend.username,
      gravatar_hash: friend.gravatar_hash,
      tmdb_avatar_path: friend.tmdb_avatar_path,
    } satisfies TFriend;
  });
}

export type TAddFriendResult =
  | { success: true; receiverId: string }
  | { error: "user_not_found" }
  | { error: "cannot_add_self" }
  | { error: "request_already_sent" }
  | { error: "they_sent_you_request" }
  | { error: "already_friends" };

export async function addFriend(
  userId: string,
  receiverTmdbId: number
): Promise<TAddFriendResult> {
  const receiver = await prisma.user.findUnique({
    where: { tmdb_id: receiverTmdbId },
  });

  if (!receiver) return { error: "user_not_found" };
  if (receiver.id === userId) return { error: "cannot_add_self" };

  const existing = await prisma.friendship.findUnique({
    where: {
      senderId_receiverId: {
        senderId: userId,
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
        receiverId: userId,
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
      senderId: userId,
      receiverId: receiver.id,
      status: "PENDING",
    },
  });

  return { success: true, receiverId: receiver.id };
}
