/**
 * Jeu d'une session « Ce soir ? » : lancement, votes, décisions (match, fin de pile),
 * nouvelle pile, départs et retraits. Chaque changement de statut est un UPDATE conditionné
 * au statut lu. Les écritures qui dépendent aussi de la pile courante (vote, choix en fin de
 * pile) passent sous le verrou de la ligne de session (`lockMovieNight`), que `saveNextRound`
 * et `reconcileMovieNight` prennent aussi : la pile ne change pas entre la vérification et
 * l'écriture. Aucun appel TMDB dans une transaction.
 */
import type { MovieNightParticipant, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  checkContinueDecision,
  checkNewRound,
  checkVote,
  checkWatchDecision,
} from "@/lib/movie-night/play";
import {
  canParticipantDecide,
  getActiveParticipantIds,
  hasEveryoneFinished,
} from "@/lib/movie-night/rules";
import type {
  TMovieNightDecision,
  TMovieNightState,
  TMovieNightStatus,
  TVote,
} from "@/lib/movie-night/types";
import {
  fail,
  getMovieNightState,
  isExpired,
  isUniqueViolation,
  lockMovieNight,
  markParticipantRemoved,
  ok,
  prepareRoundDeck,
  reconcileMovieNight,
  saveNextRound,
  type TFailure,
  type TResult,
} from "./movieNight.service";
import {
  VOTE_SELECT,
  parseDeck,
  toMovieNightSettings,
  toMovieNightStatus,
  toParticipantLike,
  toVote,
} from "./movieNightState";

/** Seul un participant `JOINED` de cette session peut agir. */
function actorFailure(movieNightId: string, actor: MovieNightParticipant): TFailure | null {
  return actor.movieNightId === movieNightId && actor.status === "JOINED"
    ? null
    : fail("not_participant");
}

/** Agir compte comme se manifester : le participant est actif pour la suite de la requête. */
async function touchParticipant(participantId: string, now: Date): Promise<void> {
  await prisma.movieNightParticipant.updateMany({
    where: { id: participantId },
    data: { lastSeenAt: now },
  });
}

/** Session non expirée avec ses participants et ses piles, la plus récente d'abord. */
async function loadPlayNight(movieNightId: string, now: Date) {
  const night = await prisma.movieNight.findUnique({
    where: { id: movieNightId },
    select: {
      status: true,
      expiresAt: true,
      pending_match_movie_id: true,
      provider_ids: true,
      genre_ids: true,
      include_seen: true,
      from_watchlists: true,
      participants: {
        select: { id: true, userId: true, status: true, isHost: true, lastSeenAt: true },
      },
      rounds: {
        orderBy: { index: "desc" },
        select: { id: true, index: true, movies: true, continued_match_movie_ids: true },
      },
    },
  });
  return night && !isExpired(night.expiresAt, now) ? night : null;
}

type TPlayNight = NonNullable<Awaited<ReturnType<typeof loadPlayNight>>>;

async function loadRoundVotes(roundId: string): Promise<TVote[]> {
  const rows = await prisma.movieNightVote.findMany({ where: { roundId }, select: VOTE_SELECT });
  return rows.map(toVote);
}

/**
 * Exécute `write` dans une transaction si, sous le verrou de la ligne de session, celle-ci a
 * encore le statut `status` et que sa pile courante est toujours celle d'index `roundIndex`.
 * False sinon (rien n'est écrit).
 */
async function writeIfUnchanged(
  movieNightId: string,
  status: TMovieNightStatus,
  roundIndex: number,
  write: (tx: Prisma.TransactionClient) => Promise<unknown>
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    if (!(await lockMovieNight(tx, movieNightId, status))) return false;
    const current = await tx.movieNightRound.findFirst({
      where: { movieNightId },
      orderBy: { index: "desc" },
      select: { index: true },
    });
    if (current?.index !== roundIndex) return false;
    await write(tx);
    return true;
  });
}

/**
 * Construit la pile suivante (participants connectés `JOINED`, hors films des piles
 * précédentes) puis l'enregistre si la session a toujours le statut `expectedStatus`.
 * TMDB est appelé avant toute transaction ; un double appel ne crée qu'une pile (`saveNextRound`).
 */
async function launchNextRound(
  movieNightId: string,
  night: TPlayNight,
  expectedStatus: TMovieNightStatus
): Promise<TResult<null>> {
  const deck = await prepareRoundDeck({
    settings: toMovieNightSettings(night),
    participantUserIds: night.participants.flatMap((p) =>
      p.status === "JOINED" && p.userId ? [p.userId] : []
    ),
    previousMovieIds: night.rounds.flatMap((r) => parseDeck(r.movies).map((m) => m.id)),
  });
  if (!deck.ok) return deck;
  const saved = await saveNextRound({
    movieNightId,
    expectedStatus,
    previousIndex: night.rounds[0]?.index ?? 0,
    deck: deck.value,
  });
  return saved ? ok(null) : fail("wrong_status");
}

/** Hôte, en salle d'attente : pile 1 puis `SWIPING`. `no_movies` laisse la session en `LOBBY`. */
export async function startMovieNight(
  movieNightId: string,
  actor: MovieNightParticipant,
  now: Date = new Date()
): Promise<TResult<TMovieNightState>> {
  const refused = actorFailure(movieNightId, actor);
  if (refused) return refused;
  if (!actor.isHost) return fail("forbidden");
  await touchParticipant(actor.id, now);

  const night = await loadPlayNight(movieNightId, now);
  if (!night) return fail("not_found");
  if (night.status !== "LOBBY") return fail("wrong_status");

  const launched = await launchNextRound(movieNightId, night, "LOBBY");
  return launched.ok ? getMovieNightState(movieNightId, actor, now) : launched;
}

/**
 * Vote sur un film de la pile courante ; le premier vote est définitif (`already_voted`
 * ensuite, d'après la contrainte unique). Refusé pendant un match (`match_pending`) et hors
 * `SWIPING`. Le vote s'écrit sous verrou : un match ou une nouvelle pile concurrents sont vus
 * avant, ou écrits après. Le `lastSeenAt` du votant est mis à jour, puis `reconcileMovieNight`
 * met la session en pause si ce vote (ou une inactivité) crée un match.
 */
export async function castVote(
  movieNightId: string,
  actor: MovieNightParticipant,
  vote: { movieId: number; liked: boolean },
  now: Date = new Date()
): Promise<TResult<TMovieNightState>> {
  const refused = actorFailure(movieNightId, actor);
  if (refused) return refused;
  await touchParticipant(actor.id, now);

  const night = await prisma.movieNight.findUnique({
    where: { id: movieNightId },
    select: {
      status: true,
      expiresAt: true,
      rounds: { orderBy: { index: "desc" }, take: 1, select: { id: true, index: true, movies: true } },
    },
  });
  if (!night || isExpired(night.expiresAt, now)) return fail("not_found");
  const round = night.rounds[0];
  const refusal = checkVote(
    toMovieNightStatus(night.status),
    round ? parseDeck(round.movies) : [],
    vote.movieId
  );
  if (refusal) return fail(refusal);
  if (!round) return fail("wrong_status");

  try {
    const saved = await writeIfUnchanged(movieNightId, "SWIPING", round.index, (tx) =>
      tx.movieNightVote.create({
        data: {
          roundId: round.id,
          participantId: actor.id,
          tmdb_movie_id: vote.movieId,
          liked: vote.liked,
        },
      })
    );
    if (!saved) {
      // Statut ou pile changés depuis la lecture : un match vient de mettre la session en pause ?
      const latest = await prisma.movieNight.findUnique({
        where: { id: movieNightId },
        select: { status: true },
      });
      return fail(latest?.status === "MATCH" ? "match_pending" : "wrong_status");
    }
  } catch (error) {
    if (isUniqueViolation(error)) return fail("already_voted");
    throw error;
  }

  await reconcileMovieNight(movieNightId, now);
  return getMovieNightState(movieNightId, actor, now);
}

const endedWith = (movieId: number) =>
  ({ status: "ENDED", chosen_movie_id: movieId, pending_match_movie_id: null }) as const;

/** « On regarde ça » : le match en attente, ou en fin de pile un match ou un film du podium. */
async function chooseMovie(
  movieNightId: string,
  night: TPlayNight,
  status: TMovieNightStatus,
  activeIds: string[],
  movieId: number
): Promise<TResult<null>> {
  const round = night.rounds[0];
  const votes = status === "SWIPING" && round ? await loadRoundVotes(round.id) : [];
  const refusal = checkWatchDecision(
    {
      status,
      pendingMatchMovieId: night.pending_match_movie_id,
      deck: round ? parseDeck(round.movies) : [],
      votes,
      continuedMatchMovieIds: round?.continued_match_movie_ids ?? [],
      activeIds,
    },
    movieId
  );
  if (refusal) return fail(refusal);

  let ended: boolean;
  if (status === "MATCH") {
    const { count } = await prisma.movieNight.updateMany({
      where: { id: movieNightId, status: "MATCH", pending_match_movie_id: movieId },
      data: endedWith(movieId),
    });
    ended = count > 0;
  } else {
    if (!round) return fail("wrong_status");
    ended = await writeIfUnchanged(movieNightId, "SWIPING", round.index, (tx) =>
      tx.movieNight.update({ where: { id: movieNightId }, data: endedWith(movieId) })
    );
  }
  return ended ? ok(null) : fail("wrong_status");
}

/**
 * « Continuer » : le match en attente rejoint les matchs continués de la pile courante et la
 * session reprend en `SWIPING`. La mise à jour est conditionnée au match lu (égal au `movieId`
 * envoyé, s'il y en a un) : deux décisions simultanées n'en continuent pas un second qui n'a
 * pas encore été montré.
 */
async function continueAfterMatch(
  movieNightId: string,
  pendingMovieId: number | null
): Promise<TResult<null>> {
  const resumed = await prisma.$transaction(async (tx) => {
    const { count } = await tx.movieNight.updateMany({
      where: { id: movieNightId, status: "MATCH", pending_match_movie_id: pendingMovieId },
      data: { status: "SWIPING", pending_match_movie_id: null },
    });
    if (count === 0) return false;
    const round = await tx.movieNightRound.findFirst({
      where: { movieNightId },
      orderBy: { index: "desc" },
      select: { id: true },
    });
    if (round && pendingMovieId !== null) {
      await tx.movieNightRound.update({
        where: { id: round.id },
        data: { continued_match_movie_ids: { push: pendingMovieId } },
      });
    }
    return true;
  });
  return resumed ? ok(null) : fail("wrong_status");
}

/**
 * Décision du chef du groupe (ou d'un actif si l'hôte est inactif) : `watch` termine la
 * session sur un film, `continue` reprend après un match, puis réconcilie (un autre match en
 * attente remet aussitôt la session en pause).
 */
export async function decide(
  movieNightId: string,
  actor: MovieNightParticipant,
  decision: TMovieNightDecision,
  now: Date = new Date()
): Promise<TResult<TMovieNightState>> {
  const refused = actorFailure(movieNightId, actor);
  if (refused) return refused;
  await touchParticipant(actor.id, now);

  const night = await loadPlayNight(movieNightId, now);
  if (!night) return fail("not_found");
  const participants = night.participants.map(toParticipantLike);
  if (!canParticipantDecide(actor.id, participants, now)) return fail("forbidden");
  const status = toMovieNightStatus(night.status);

  if (decision.action === "watch") {
    const activeIds = getActiveParticipantIds(participants, now);
    const chosen = await chooseMovie(movieNightId, night, status, activeIds, decision.movieId);
    if (!chosen.ok) return chosen;
  } else {
    const refusal = checkContinueDecision(status, night.pending_match_movie_id, decision.movieId);
    if (refusal) return fail(refusal);
    const resumed = await continueAfterMatch(movieNightId, night.pending_match_movie_id);
    if (!resumed.ok) return resumed;
    await reconcileMovieNight(movieNightId, now);
  }
  return getMovieNightState(movieNightId, actor, now);
}

/** « Nouvelle pile » : quand tous les actifs ont fini la pile courante (`not_finished` sinon). */
export async function startNewRound(
  movieNightId: string,
  actor: MovieNightParticipant,
  now: Date = new Date()
): Promise<TResult<TMovieNightState>> {
  const refused = actorFailure(movieNightId, actor);
  if (refused) return refused;
  await touchParticipant(actor.id, now);

  const night = await loadPlayNight(movieNightId, now);
  if (!night) return fail("not_found");
  const participants = night.participants.map(toParticipantLike);
  if (!canParticipantDecide(actor.id, participants, now)) return fail("forbidden");

  const status = toMovieNightStatus(night.status);
  const round = night.rounds[0];
  const everyoneFinished =
    status === "SWIPING" && round
      ? hasEveryoneFinished(
          parseDeck(round.movies),
          await loadRoundVotes(round.id),
          getActiveParticipantIds(participants, now)
        )
      : false;
  const refusal = checkNewRound(status, everyoneFinished);
  if (refusal) return fail(refusal);

  const launched = await launchNextRound(movieNightId, night, "SWIPING");
  return launched.ok ? getMovieNightState(movieNightId, actor, now) : launched;
}

/**
 * « Quitter » : le participant passe en `LEFT` (ses votes ne comptent plus). L'hôte qui
 * quitte termine la session pour tout le monde, sans film retenu ; sinon réconciliation
 * (l'unanimité porte sur moins de monde). Quitter deux fois ne fait rien de plus.
 */
export async function leaveMovieNight(
  movieNightId: string,
  actor: MovieNightParticipant,
  now: Date = new Date()
): Promise<TResult<null>> {
  if (actor.movieNightId === movieNightId && actor.status === "LEFT") return ok(null);
  const refused = actorFailure(movieNightId, actor);
  if (refused) return refused;

  const night = await prisma.movieNight.findUnique({
    where: { id: movieNightId },
    select: { expiresAt: true },
  });
  if (!night || isExpired(night.expiresAt, now)) return fail("not_found");

  const leave = { where: { id: actor.id, status: "JOINED" }, data: { status: "LEFT" } };
  if (actor.isHost) {
    await prisma.$transaction([
      prisma.movieNightParticipant.updateMany(leave),
      prisma.movieNight.updateMany({
        where: { id: movieNightId, status: { not: "ENDED" } },
        data: { status: "ENDED", pending_match_movie_id: null },
      }),
    ]);
    return ok(null);
  }
  await prisma.movieNightParticipant.updateMany(leave);
  await reconcileMovieNight(movieNightId, now);
  return ok(null);
}

/** Hôte : retire un participant `JOINED` (`REMOVED`, ne peut plus revenir ; invité : nouveau code), puis réconcilie. */
export async function removeParticipant(
  movieNightId: string,
  actor: MovieNightParticipant,
  participantId: string,
  now: Date = new Date()
): Promise<TResult<TMovieNightState>> {
  const refused = actorFailure(movieNightId, actor);
  if (refused) return refused;
  if (!actor.isHost) return fail("forbidden");
  if (participantId === actor.id) {
    return fail("invalid_input", "Utilisez « Quitter » pour quitter la session.");
  }
  await touchParticipant(actor.id, now);

  const night = await prisma.movieNight.findUnique({
    where: { id: movieNightId },
    select: { expiresAt: true },
  });
  if (!night || isExpired(night.expiresAt, now)) return fail("not_found");

  const notMember = fail("invalid_input", "Ce participant ne fait pas partie de la session.");
  const target = await prisma.movieNightParticipant.findFirst({
    where: { id: participantId, movieNightId, status: { in: ["JOINED", "REMOVED"] } },
    select: { userId: true, status: true },
  });
  if (!target) return notMember;
  // Déjà REMOVED : retrait idempotent (double toucher), sans changer le code une 2e fois.
  if (
    target.status === "JOINED" &&
    !(await markParticipantRemoved(movieNightId, participantId, target.userId === null))
  ) {
    return notMember;
  }

  await reconcileMovieNight(movieNightId, now);
  return getMovieNightState(movieNightId, actor, now);
}
