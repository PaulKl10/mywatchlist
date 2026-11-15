import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { MovieNightParticipant } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { GUEST_COOKIE } from "@/lib/movie-night/constants";
import { getCurrentSession } from "./session.service";

/** Jeton du cookie invité (32 octets aléatoires, base64url) et son hash, seul stocké en base. */
export function createGuestToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashGuestToken(token) };
}

/** SHA-256 hexadécimal du jeton invité. */
export function hashGuestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Pose le cookie invité (un seul par navigateur : rejoindre une autre session le remplace). Route Handler uniquement. */
export async function setGuestCookie(token: string, expiresAt: Date): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Participant invité de cette session désigné par le cookie du navigateur, quel que soit son statut. */
export async function findGuestParticipant(
  movieNightId: string
): Promise<MovieNightParticipant | null> {
  const token = (await cookies()).get(GUEST_COOKIE)?.value;
  if (!token) return null;
  return prisma.movieNightParticipant.findUnique({
    where: { guestTokenHash: hashGuestToken(token), movieNightId },
  });
}

/**
 * Participant courant de la session : celui de l'utilisateur connecté s'il existe pour
 * cette session, sinon celui désigné par le cookie invité. Quel que soit son statut :
 * chaque service vérifie celui qu'il exige.
 */
export async function resolveMovieNightParticipant(
  movieNightId: string
): Promise<MovieNightParticipant | null> {
  const current = await getCurrentSession();
  if (current) {
    const participant = await prisma.movieNightParticipant.findUnique({
      where: { movieNightId_userId: { movieNightId, userId: current.user.id } },
    });
    if (participant) return participant;
  }
  return findGuestParticipant(movieNightId);
}
