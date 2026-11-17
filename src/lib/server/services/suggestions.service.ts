import type { Suggestion, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { declineReasonLabel, type TDeclineReason } from "@/lib/suggestions/declineReasons";
import { findAcceptedFriendship } from "./friends.service";
import { userDisplayName } from "./movieNightState";
import { schedulePushNotification } from "./push.service";

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

  const friendship = await findAcceptedFriendship(userId, receiver.id);
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

/** Réponse du destinataire : ajout à sa watchlist, ou refus avec un motif. */
export type TSuggestionAnswer = { accepted: true } | { accepted: false; reason: TDeclineReason };

/**
 * Clôt la suggestion et prévient son auteur (notification enregistrée, puis push après la
 * réponse HTTP). Suppression et notification sont atomiques ; false si la suggestion était
 * déjà traitée (double clic, autre appareil) : rien n'est alors notifié une seconde fois.
 * À appeler depuis un Route Handler (push planifié avec `after`).
 */
export async function closeSuggestion(
  suggestion: Suggestion,
  responder: Pick<User, "id" | "tmdb_id" | "username">,
  answer: TSuggestionAnswer
): Promise<boolean> {
  const mediaType = suggestion.media_type === "tv" ? "tv" : "movie";
  const reason = answer.accepted ? null : answer.reason;

  const closed = await prisma.$transaction(async (tx) => {
    const { count } = await tx.suggestion.deleteMany({ where: { id: suggestion.id } });
    if (count === 0) return false;
    await tx.userNotification.create({
      data: {
        userId: suggestion.fromUserId,
        actorId: responder.id,
        type: answer.accepted ? "SUGGESTION_ACCEPTED" : "SUGGESTION_DECLINED",
        tmdb_id: suggestion.tmdb_movie_id,
        media_type: mediaType,
        title: suggestion.title,
        reason,
      },
    });
    return true;
  });

  if (closed) {
    schedulePushNotification(suggestion.fromUserId, {
      type: "suggestion_answered",
      fromName: userDisplayName(responder),
      fromUserId: responder.id,
      title: suggestion.title,
      mediaType,
      tmdbId: suggestion.tmdb_movie_id,
      accepted: answer.accepted,
      reasonLabel: declineReasonLabel(reason),
    });
  }
  return closed;
}
