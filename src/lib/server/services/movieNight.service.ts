import { Prisma, type MovieNightParticipant, type User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { tmdbErrorMessage } from "@/lib/tmdb-client";
import {
  DECK_SIZE,
  GUEST_NAME_MAX_LENGTH,
  MAX_PARTICIPANTS,
  SESSION_TTL_MS,
} from "@/lib/movie-night/constants";
import { generateMovieNightCode, normalizeMovieNightCode } from "@/lib/movie-night/code";
import { computeMatches, findMatchToPause, getActiveParticipantIds } from "@/lib/movie-night/rules";
import type {
  TDeckMovie,
  TMovieNightErrorCode,
  TMovieNightInvite,
  TMovieNightSettings,
  TMovieNightState,
  TMovieNightStatus,
} from "@/lib/movie-night/types";
import { parseGuestName } from "@/lib/movie-night/validation";
import { findAcceptedFriendship } from "./friends.service";
import { createGuestToken, findGuestParticipant } from "./movieNightAccess.service";
import { buildDeck, getSeenMovieIds } from "./movieNightDeck.service";
import {
  USER_DISPLAY_SELECT,
  VOTE_SELECT,
  buildMovieNightState,
  isNameTaken,
  parseDeck,
  participantDisplayName,
  toParticipantLike,
  toVote,
  userAvatarUrl,
  userDisplayName,
} from "./movieNightState";

export type TResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: TMovieNightErrorCode; message?: string };
export type TFailure = Extract<TResult<never>, { ok: false }>;

export const ok = <T>(value: T): TResult<T> => ({ ok: true, value });
export const fail = (error: TMovieNightErrorCode, message?: string): TFailure => ({
  ok: false,
  error,
  message,
});

/** TMDB a échoué pendant la construction d'une pile ; déjà loggé avec `tmdbErrorMessage`. */
export class MovieNightTmdbError extends Error {
  constructor() {
    super("TMDB indisponible pendant la construction de la pile");
    this.name = "MovieNightTmdbError";
  }
}

const MAX_CODE_ATTEMPTS = 5;

/** Violation d'une contrainte d'unicité Prisma (P2002). */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** Expirée = `expiresAt < now` (même règle que la suppression paresseuse). */
export function isExpired(expiresAt: Date, now: Date): boolean {
  return expiresAt.getTime() < now.getTime();
}

/**
 * Pile d'un round : exclut les films déjà vus des participants connectés (sauf
 * `includeSeen`) et ceux des piles précédentes. Appelle TMDB : aucune écriture ici, et
 * jamais à l'intérieur d'une transaction Prisma. `MovieNightTmdbError` si TMDB échoue.
 */
export async function prepareRoundDeck(args: {
  settings: TMovieNightSettings;
  participantUserIds: string[];
  previousMovieIds: number[];
}): Promise<TResult<TDeckMovie[]>> {
  const { settings, participantUserIds, previousMovieIds } = args;
  const seen = settings.includeSeen ? [] : await getSeenMovieIds(participantUserIds);
  let deck: TDeckMovie[];
  try {
    deck = await buildDeck({
      providerIds: settings.providerIds,
      genreIds: settings.genreIds,
      deckSize: DECK_SIZE,
      excludedMovieIds: [...seen, ...previousMovieIds],
    });
  } catch (error) {
    console.error("movie-night: échec TMDB pendant la construction de la pile", tmdbErrorMessage(error));
    throw new MovieNightTmdbError();
  }
  return deck.length === 0 ? fail("no_movies") : ok(deck);
}

/**
 * Verrouille la ligne de session jusqu'à la fin de la transaction `tx` (UPDATE sans effet),
 * si elle a encore le statut `status` ; false sinon. `saveNextRound` prend le même verrou
 * (son UPDATE de statut) avant de créer une pile : une fois le verrou obtenu, la pile
 * courante lue dans `tx` ne change plus avant la fin de la transaction.
 */
export async function lockMovieNight(
  tx: Prisma.TransactionClient,
  movieNightId: string,
  status: TMovieNightStatus
): Promise<boolean> {
  const { count } = await tx.movieNight.updateMany({
    where: { id: movieNightId, status },
    data: { status },
  });
  return count > 0;
}

/**
 * Enregistre `deck` comme round `previousIndex + 1` et passe la session en `SWIPING`, dans
 * une transaction, si elle a encore le statut `expectedStatus`. La contrainte unique
 * [movieNightId, index] départage deux appels simultanés : un seul round est créé, l'autre
 * appel renvoie false. À appeler après `prepareRoundDeck`, hors de toute transaction.
 */
export async function saveNextRound(args: {
  movieNightId: string;
  expectedStatus: TMovieNightStatus;
  previousIndex: number;
  deck: TDeckMovie[];
}): Promise<boolean> {
  const { movieNightId, expectedStatus, previousIndex, deck } = args;
  try {
    return await prisma.$transaction(async (tx) => {
      const { count } = await tx.movieNight.updateMany({
        where: { id: movieNightId, status: expectedStatus },
        data: { status: "SWIPING", pending_match_movie_id: null },
      });
      if (count === 0) return false;
      await tx.movieNightRound.create({
        data: { movieNightId, index: previousIndex + 1, movies: deck },
      });
      return true;
    });
  } catch (error) {
    if (isUniqueViolation(error)) return false;
    throw error;
  }
}

/** Mémorise les plateformes choisies comme hôte (pré-remplies au prochain formulaire). */
async function rememberProviders(userId: string, providerIds: number[]): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { streaming_provider_ids: providerIds } });
}

/**
 * Insère une session en salle d'attente avec son hôte, atomiquement. Supprime
 * paresseusement les sessions expirées et retente avec un nouveau code en cas de collision.
 */
async function insertMovieNight(
  args: {
    hostId: string | null;
    hostParticipant: Prisma.MovieNightParticipantCreateWithoutMovieNightInput;
    settings: TMovieNightSettings;
  },
  now: Date
): Promise<{ id: string; expiresAt: Date }> {
  const { hostId, hostParticipant, settings } = args;
  await prisma.movieNight.deleteMany({ where: { expiresAt: { lt: now } } });

  for (let attempt = 1; ; attempt++) {
    try {
      // Une création avec écriture imbriquée est atomique : session et hôte ensemble.
      return await prisma.movieNight.create({
        data: {
          code: generateMovieNightCode(),
          hostId,
          status: "LOBBY",
          provider_ids: settings.providerIds,
          genre_ids: settings.genreIds,
          deck_size: DECK_SIZE,
          include_seen: settings.includeSeen,
          expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
          participants: { create: hostParticipant },
        },
        select: { id: true, expiresAt: true },
      });
    } catch (error) {
      // Seul le code est unique parmi ces nouvelles lignes : collision → nouveau code.
      if (!isUniqueViolation(error) || attempt >= MAX_CODE_ATTEMPTS) throw error;
    }
  }
}

/** Crée une session en salle d'attente dont `host` est l'hôte (le solo ne crée pas de session). */
export async function createMovieNight(
  host: User,
  settings: TMovieNightSettings,
  now: Date = new Date()
): Promise<TResult<{ id: string }>> {
  await rememberProviders(host.id, settings.providerIds);
  const night = await insertMovieNight(
    {
      hostId: host.id,
      hostParticipant: {
        user: { connect: { id: host.id } },
        status: "JOINED",
        isHost: true,
        lastSeenAt: now,
      },
      settings,
    },
    now
  );
  return ok({ id: night.id });
}

/**
 * Crée une session dont l'hôte est un invité (sans compte) identifié par un pseudo et le
 * cookie invité : renvoie le jeton à poser. Rien n'est écrit si le pseudo est invalide.
 */
export async function createGuestMovieNight(
  args: { guestName: unknown; settings: TMovieNightSettings },
  now: Date = new Date()
): Promise<TResult<{ id: string; guestToken: string; expiresAt: Date }>> {
  const guestName = parseGuestName(args.guestName);
  if (guestName === null) {
    return fail("invalid_input", `Choisissez un pseudo de 1 à ${GUEST_NAME_MAX_LENGTH} caractères.`);
  }
  const { token, hash } = createGuestToken();
  const night = await insertMovieNight(
    {
      hostId: null,
      hostParticipant: {
        guestName,
        guestTokenHash: hash,
        status: "JOINED",
        isHost: true,
        lastSeenAt: now,
      },
      settings: args.settings,
    },
    now
  );
  return ok({ id: night.id, guestToken: token, expiresAt: night.expiresAt });
}

/**
 * Pile d'une partie solo, jouée dans le navigateur : aucune session en base. Mémorise les
 * plateformes et exclut les déjà-vus de `user` (sauf `includeSeen`) ; sans compte (`user` nul),
 * ni l'un ni l'autre. Exclut aussi `excludedMovieIds`
 * (films déjà proposés, pour « Nouvelle pile »). `MovieNightTmdbError` si TMDB échoue.
 */
export async function buildSoloDeck(
  user: User | null,
  settings: TMovieNightSettings,
  excludedMovieIds: number[]
): Promise<TResult<TDeckMovie[]>> {
  if (user) await rememberProviders(user.id, settings.providerIds);
  return prepareRoundDeck({
    settings,
    participantUserIds: user ? [user.id] : [],
    previousMovieIds: excludedMovieIds,
  });
}

/**
 * Exécute `admit` dans une transaction, après avoir verrouillé la session par un UPDATE
 * sans effet conditionné à « LOBBY et non expirée » : deux arrivées simultanées passent
 * l'une après l'autre (la limite de participants tient) et un lancement concurrent attend.
 * Avec `code`, la session doit encore avoir ce code : un code changé entre-temps (invité
 * retiré, voir `markParticipantRemoved`) ne fait plus entrer personne.
 */
async function withOpenLobby<T>(
  movieNightId: string,
  now: Date,
  closedError: TMovieNightErrorCode,
  admit: (tx: Prisma.TransactionClient) => Promise<TResult<T>>,
  code?: string
): Promise<TResult<T>> {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.movieNight.updateMany({
      where: { id: movieNightId, status: "LOBBY", expiresAt: { gte: now }, ...(code && { code }) },
      data: { status: "LOBBY" },
    });
    return count === 0 ? fail(closedError) : admit(tx);
  });
}

/** L'utilisateur passe en `JOINED` (idempotent ; `REMOVED` refusé ; 4 participants maximum). */
async function admitUser(
  movieNightId: string,
  userId: string,
  closedError: TMovieNightErrorCode,
  now: Date
): Promise<TResult<null>> {
  return withOpenLobby(movieNightId, now, closedError, async (tx) => {
    const existing = await tx.movieNightParticipant.findUnique({
      where: { movieNightId_userId: { movieNightId, userId } },
      select: { id: true, status: true },
    });
    if (existing?.status === "JOINED") return ok(null);
    if (existing?.status === "REMOVED") {
      return fail("forbidden", "Vous avez été retiré de cette session.");
    }
    const joinedCount = await tx.movieNightParticipant.count({
      where: { movieNightId, status: "JOINED" },
    });
    if (joinedCount >= MAX_PARTICIPANTS) return fail("session_full");
    if (existing) {
      await tx.movieNightParticipant.update({
        where: { id: existing.id },
        data: { status: "JOINED", lastSeenAt: now },
      });
    } else {
      await tx.movieNightParticipant.create({
        data: { movieNightId, userId, status: "JOINED", lastSeenAt: now },
      });
    }
    return ok(null);
  });
}

/** Invité arrivé par `code` : pseudo unique (casse ignorée) parmi les `JOINED`, 4 participants maximum. */
async function admitGuest(
  movieNightId: string,
  code: string,
  guestName: string,
  guestTokenHash: string,
  now: Date
): Promise<TResult<null>> {
  return withOpenLobby(
    movieNightId,
    now,
    "invalid_code",
    async (tx) => {
      const members = await tx.movieNightParticipant.findMany({
        where: { movieNightId, status: "JOINED" },
        select: { guestName: true, user: { select: { tmdb_id: true, username: true } } },
      });
      if (members.length >= MAX_PARTICIPANTS) return fail("session_full");
      if (isNameTaken(guestName, members.map(participantDisplayName))) return fail("name_taken");
      await tx.movieNightParticipant.create({
        data: { movieNightId, guestName, guestTokenHash, status: "JOINED", lastSeenAt: now },
      });
      return ok(null);
    },
    code
  );
}

/**
 * Passe un participant `JOINED` en `REMOVED` ; true s'il était encore `JOINED`. Un invité
 * n'est reconnu que par son cookie : retiré en salle d'attente, il pourrait revenir par
 * l'ancien code depuis une fenêtre privée. Le code change donc dans la même transaction,
 * session verrouillée avant le participant comme pour les arrivées (`withOpenLobby`).
 */
export async function markParticipantRemoved(
  movieNightId: string,
  participantId: string,
  isGuest: boolean
): Promise<boolean> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        if (isGuest) {
          await tx.movieNight.updateMany({
            where: { id: movieNightId, status: "LOBBY" },
            data: { code: generateMovieNightCode() },
          });
        }
        const { count } = await tx.movieNightParticipant.updateMany({
          where: { id: participantId, movieNightId, status: "JOINED" },
          data: { status: "REMOVED" },
        });
        return count > 0;
      });
    } catch (error) {
      // Collision de code : la transaction est annulée en entier, on retente avec un autre.
      if (!isUniqueViolation(error) || attempt >= MAX_CODE_ATTEMPTS) throw error;
    }
  }
}

/**
 * Rejoindre par code (session en `LOBBY` et non expirée). Un cookie invité désignant un
 * participant `JOINED` l'emporte, connecté ou non. Sinon, connecté : sous son compte.
 * Invité : pseudo + nouveau jeton à poser en cookie (`guestToken`), sauf si le cookie du
 * navigateur désigne déjà un participant `JOINED` de cette session (rien à refaire).
 */
export async function joinMovieNightByCode(
  args: { code: string; user: User | null; guestName: unknown },
  now: Date = new Date()
): Promise<TResult<{ id: string; guestToken: string | null; expiresAt: Date }>> {
  const code = normalizeMovieNightCode(args.code);
  if (!code) return fail("invalid_code");
  const night = await prisma.movieNight.findUnique({
    where: { code },
    select: { id: true, status: true, expiresAt: true },
  });
  if (!night || night.status !== "LOBBY" || isExpired(night.expiresAt, now)) {
    return fail("invalid_code");
  }
  const joined = { id: night.id, expiresAt: night.expiresAt };

  // Le cookie invité prime, même connecté : un hôte invité qui s'est connecté reste le même participant.
  const previous = await findGuestParticipant(night.id);
  if (previous?.status === "JOINED") return ok({ ...joined, guestToken: null });

  if (args.user) {
    const admitted = await admitUser(night.id, args.user.id, "invalid_code", now);
    return admitted.ok ? ok({ ...joined, guestToken: null }) : admitted;
  }

  if (previous?.status === "REMOVED") {
    return fail("forbidden", "Vous avez été retiré de cette session.");
  }

  const guestName = parseGuestName(args.guestName);
  if (!guestName) {
    return fail("invalid_input", `Choisissez un pseudo de 1 à ${GUEST_NAME_MAX_LENGTH} caractères.`);
  }
  const { token, hash } = createGuestToken();
  const admitted = await admitGuest(night.id, code, guestName, hash, now);
  return admitted.ok ? ok({ ...joined, guestToken: token }) : admitted;
}

/** Hôte, en salle d'attente : invite un ami accepté (crée ou repasse en `INVITED`). */
export async function inviteFriend(
  movieNightId: string,
  actor: MovieNightParticipant,
  friendUserId: string
): Promise<TResult<{ invited: boolean }>> {
  if (actor.status !== "JOINED") return fail("not_participant");
  if (!actor.isHost || !actor.userId) return fail("forbidden");
  const night = await prisma.movieNight.findUnique({
    where: { id: movieNightId },
    select: { status: true, expiresAt: true },
  });
  if (!night || isExpired(night.expiresAt, new Date())) return fail("not_found");
  if (night.status !== "LOBBY") return fail("wrong_status");
  if (!(await findAcceptedFriendship(actor.userId, friendUserId))) return fail("not_friends");

  const existing = await prisma.movieNightParticipant.findUnique({
    where: { movieNightId_userId: { movieNightId, userId: friendUserId } },
    select: { id: true, status: true },
  });
  if (existing?.status === "JOINED") return ok({ invited: false });
  if (existing) {
    // Ne renvoie « invité » que si le statut change vraiment (pas de push en double).
    const { count } = await prisma.movieNightParticipant.updateMany({
      where: { id: existing.id, status: { notIn: ["JOINED", "INVITED"] } },
      data: { status: "INVITED" },
    });
    return ok({ invited: count > 0 });
  }
  try {
    await prisma.movieNightParticipant.create({
      data: { movieNightId, userId: friendUserId, status: "INVITED" },
    });
  } catch (error) {
    // L'ami vient de rejoindre par le code : il est déjà dans la session.
    if (!isUniqueViolation(error)) throw error;
    return ok({ invited: false });
  }
  return ok({ invited: true });
}

function pendingInvitesWhere(userId: string, now: Date): Prisma.MovieNightParticipantWhereInput {
  return {
    userId,
    status: "INVITED",
    movieNight: { status: "LOBBY", expiresAt: { gte: now } },
  };
}

/** Invitations en attente : `INVITED` sur des sessions en `LOBBY` non expirées, plus récentes d'abord. */
export async function listPendingInvites(
  userId: string,
  now: Date = new Date()
): Promise<TMovieNightInvite[]> {
  const rows = await prisma.movieNightParticipant.findMany({
    where: pendingInvitesWhere(userId, now),
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      movieNight: { select: { id: true, host: { select: USER_DISPLAY_SELECT } } },
    },
  });
  return rows.map((row) => ({
    movieNightId: row.movieNight.id,
    hostName: row.movieNight.host ? userDisplayName(row.movieNight.host) : "Invité",
    hostAvatarUrl: row.movieNight.host ? userAvatarUrl(row.movieNight.host) : null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function countPendingInvites(userId: string, now: Date = new Date()): Promise<number> {
  return prisma.movieNightParticipant.count({ where: pendingInvitesWhere(userId, now) });
}

/** Réponse à une invitation : accepter suit les règles de « rejoindre » ; refuser → `DECLINED`. */
export async function respondToInvite(
  movieNightId: string,
  user: User,
  accept: boolean,
  now: Date = new Date()
): Promise<TResult<{ id: string }>> {
  const participant = await prisma.movieNightParticipant.findUnique({
    where: { movieNightId_userId: { movieNightId, userId: user.id } },
    select: { id: true, status: true },
  });
  if (!participant) return fail("not_participant");
  if (participant.status === "JOINED") {
    return accept
      ? ok({ id: movieNightId })
      : fail("wrong_status", "Vous avez déjà rejoint cette session.");
  }
  if (participant.status !== "INVITED") return fail("not_participant");

  if (!accept) {
    await prisma.movieNightParticipant.updateMany({
      where: { id: participant.id, status: "INVITED" },
      data: { status: "DECLINED" },
    });
    return ok({ id: movieNightId });
  }

  const night = await prisma.movieNight.findUnique({
    where: { id: movieNightId },
    select: { status: true, expiresAt: true },
  });
  if (!night || isExpired(night.expiresAt, now)) return fail("not_found");
  if (night.status !== "LOBBY") return fail("wrong_status", "La session a déjà commencé.");
  const admitted = await admitUser(movieNightId, user.id, "wrong_status", now);
  return admitted.ok ? ok({ id: movieNightId }) : admitted;
}

/**
 * Réconciliation (spec) : en `SWIPING`, si un match de la pile courante n'a pas été
 * « continué », la session passe en `MATCH` sur le premier dans l'ordre de la pile.
 * L'écriture se fait sous `lockMovieNight(SWIPING)` : deux appels simultanés ne posent qu'un
 * match. Sous ce verrou, on revérifie que la pile lue est toujours la courante (une nouvelle
 * pile enregistrée entre la lecture et l'écriture ne doit pas être mise en pause sur un match
 * de la précédente) et que ce match n'a pas été continué entre-temps. Une simple condition
 * « aucun round plus récent » dans l'UPDATE ne suffirait pas : en READ COMMITTED, un UPDATE
 * qui attend le verrou d'un `saveNextRound` en cours revérifie la ligne de session mais pas
 * les rounds insérés par cette transaction.
 */
export async function reconcileMovieNight(movieNightId: string, now: Date): Promise<void> {
  const night = await prisma.movieNight.findUnique({
    where: { id: movieNightId },
    select: {
      status: true,
      participants: { select: { id: true, status: true, isHost: true, lastSeenAt: true } },
      rounds: {
        orderBy: { index: "desc" },
        take: 1,
        select: {
          index: true,
          movies: true,
          continued_match_movie_ids: true,
          votes: { select: VOTE_SELECT },
        },
      },
    },
  });
  const round = night?.rounds[0];
  if (!night || night.status !== "SWIPING" || !round) return;

  const activeIds = getActiveParticipantIds(night.participants.map(toParticipantLike), now);
  const matches = computeMatches(parseDeck(round.movies), round.votes.map(toVote), activeIds);
  const movieId = findMatchToPause(matches, round.continued_match_movie_ids);
  if (movieId === null) return;
  await prisma.$transaction(async (tx) => {
    if (!(await lockMovieNight(tx, movieNightId, "SWIPING"))) return;
    const current = await tx.movieNightRound.findFirst({
      where: { movieNightId },
      orderBy: { index: "desc" },
      select: { index: true, continued_match_movie_ids: true },
    });
    if (current?.index !== round.index || current.continued_match_movie_ids.includes(movieId)) return;
    await tx.movieNight.update({
      where: { id: movieNightId },
      data: { status: "MATCH", pending_match_movie_id: movieId },
    });
  });
}

/** État de la session pour `actor` (participant `JOINED`) ; met à jour son « vu à » et réconcilie. */
export async function getMovieNightState(
  movieNightId: string,
  actor: MovieNightParticipant,
  now: Date = new Date()
): Promise<TResult<TMovieNightState>> {
  const existing = await prisma.movieNight.findUnique({
    where: { id: movieNightId },
    select: { expiresAt: true },
  });
  if (!existing || isExpired(existing.expiresAt, now)) return fail("not_found");
  if (actor.movieNightId !== movieNightId || actor.status !== "JOINED") {
    return fail("not_participant");
  }

  await prisma.movieNightParticipant.updateMany({
    where: { id: actor.id },
    data: { lastSeenAt: now },
  });
  await reconcileMovieNight(movieNightId, now);

  const night = await prisma.movieNight.findUnique({
    where: { id: movieNightId },
    include: {
      participants: {
        orderBy: [{ isHost: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          userId: true,
          guestName: true,
          status: true,
          isHost: true,
          lastSeenAt: true,
          user: { select: USER_DISPLAY_SELECT },
        },
      },
      rounds: {
        orderBy: { index: "asc" },
        select: { id: true, index: true, movies: true, continued_match_movie_ids: true },
      },
    },
  });
  if (!night) return fail("not_found");
  const current = night.rounds.at(-1);
  const votes = current
    ? await prisma.movieNightVote.findMany({ where: { roundId: current.id }, select: VOTE_SELECT })
    : [];

  return ok(
    buildMovieNightState({
      night,
      participants: night.participants,
      rounds: night.rounds.map((r) => ({ index: r.index, movies: parseDeck(r.movies) })),
      currentVotes: votes.map(toVote),
      currentContinuedMatchIds: current?.continued_match_movie_ids ?? [],
      meId: actor.id,
      now,
    })
  );
}
