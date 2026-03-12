import { prisma } from "@/lib/prisma";

export type TSuggestion = {
  id: string;
  tmdb_movie_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  sender: {
    tmdb_id: number;
    username: string | null;
  };
  createdAt: string;
};

export async function getSuggestions(
  userId: string
): Promise<TSuggestion[]> {
  const suggestions = await prisma.suggestion.findMany({
    where: { toUserId: userId },
    include: { sender: true },
    orderBy: { createdAt: "desc" },
  });

  return suggestions.map((s) => ({
    id: s.id,
    tmdb_movie_id: s.tmdb_movie_id,
    media_type: (s.media_type as "movie" | "tv") || "movie",
    title: s.title,
    poster_path: s.poster_path,
    sender: {
      tmdb_id: s.sender.tmdb_id,
      username: s.sender.username,
    },
    createdAt: s.createdAt.toISOString(),
  }));
}

export type CreateSuggestionInput = {
  receiverId: string;
  tmdbMovieId: number;
  media_type?: "movie" | "tv";
  title: string;
  poster_path?: string | null;
};

export async function createSuggestion(
  userId: string,
  input: CreateSuggestionInput
): Promise<
  | { success: true }
  | { error: "receiver_not_found" }
  | { error: "cannot_suggest_to_self" }
  | { error: "not_friends" }
  | { error: "already_suggested" }
> {
  const { receiverId, tmdbMovieId, media_type = "movie", title, poster_path } =
    input;

  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
  });
  if (!receiver) return { error: "receiver_not_found" };

  if (receiver.id === userId) return { error: "cannot_suggest_to_self" };

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: userId, receiverId: receiver.id },
        { senderId: receiver.id, receiverId: userId },
      ],
    },
  });
  if (!friendship) return { error: "not_friends" };

  const existing = await prisma.suggestion.findFirst({
    where: {
      fromUserId: userId,
      toUserId: receiver.id,
      tmdb_movie_id: tmdbMovieId,
      media_type: media_type,
    },
  });
  if (existing) return { error: "already_suggested" };

  await prisma.suggestion.create({
    data: {
      fromUserId: userId,
      toUserId: receiver.id,
      tmdb_movie_id: tmdbMovieId,
      media_type: media_type,
      title,
      poster_path:
        typeof poster_path === "string" || poster_path === null
          ? poster_path
          : undefined,
    },
  });

  return { success: true };
}
