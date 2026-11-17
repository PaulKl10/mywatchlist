import { describe, expect, it } from "vitest";
import {
  buildNotificationItems,
  isUnreadNotification,
  NOTIFICATION_HREFS,
  type TNotificationSources,
} from "./items";

const actor = (name: string) => ({ name, avatarUrl: null });
const at = (iso: string) => new Date(iso);

const empty: TNotificationSources = {
  invites: [],
  friendRequests: [],
  suggestions: [],
  answers: [],
  reactions: [],
};

const answer = (overrides: Partial<TNotificationSources["answers"][number]> = {}) => ({
  id: "a1",
  createdAt: at("2026-11-17T09:00:00Z"),
  responder: actor("Léa"),
  accepted: true,
  reason: null,
  title: "Dune",
  mediaType: "movie" as const,
  tmdbId: 438631,
  read: false,
  ...overrides,
});

describe("buildNotificationItems", () => {
  it("ne renvoie rien sans demande en attente", () => {
    expect(buildNotificationItems(empty)).toEqual([]);
  });

  it("mélange les trois sources, de la plus récente à la plus ancienne", () => {
    const items = buildNotificationItems({
      ...empty,
      invites: [{ movieNightId: "n1", createdAt: at("2026-11-17T20:00:00Z"), host: actor("Léa") }],
      friendRequests: [{ id: "f1", createdAt: at("2026-11-15T10:00:00Z"), sender: actor("Tom") }],
      suggestions: [
        {
          id: "s1",
          createdAt: at("2026-11-16T10:00:00Z"),
          sender: actor("Max"),
          title: "Dune",
          mediaType: "movie",
        },
      ],
    });
    expect(items.map((i) => i.id)).toEqual([
      "movie_night_invite:n1",
      "suggestion:s1",
      "friend_request:f1",
    ]);
  });

  it("mène chaque demande à la page où la traiter", () => {
    const items = buildNotificationItems({
      ...empty,
      invites: [{ movieNightId: "n1", createdAt: at("2026-11-17T00:00:00Z"), host: actor("Léa") }],
      friendRequests: [{ id: "f1", createdAt: at("2026-11-16T00:00:00Z"), sender: actor("Tom") }],
      suggestions: [
        {
          id: "s1",
          createdAt: at("2026-11-15T00:00:00Z"),
          sender: actor("Max"),
          title: "The Bear",
          mediaType: "tv",
        },
      ],
    });
    expect(items.map((i) => i.href)).toEqual([
      "/ce-soir",
      "/profile#demandes-ami",
      "/profile#suggestions",
    ]);
    expect(NOTIFICATION_HREFS.movie_night_invite).toBe("/ce-soir");
  });

  it("garde le titre et le type de média d'une suggestion", () => {
    const [item] = buildNotificationItems({
      ...empty,
      suggestions: [
        {
          id: "s1",
          createdAt: at("2026-11-15T00:00:00Z"),
          sender: actor("Max"),
          title: "The Bear",
          mediaType: "tv",
        },
      ],
    });
    expect(item).toEqual({
      type: "suggestion",
      id: "suggestion:s1",
      actor: actor("Max"),
      createdAt: "2026-11-15T00:00:00.000Z",
      href: "/profile#suggestions",
      title: "The Bear",
      mediaType: "tv",
    });
  });

  it("réponse à ma suggestion : mène à la fiche du titre, non lue tant qu'elle n'est pas vue", () => {
    const [accepted, declined] = buildNotificationItems({
      ...empty,
      answers: [
        answer(),
        answer({
          id: "a2",
          createdAt: at("2026-11-16T09:00:00Z"),
          accepted: false,
          reason: "ALREADY_SEEN",
          mediaType: "tv",
          tmdbId: 1399,
          read: true,
        }),
      ],
    });
    expect(accepted).toEqual({
      type: "suggestion_answered",
      id: "suggestion_answered:a1",
      actor: actor("Léa"),
      createdAt: "2026-11-17T09:00:00.000Z",
      href: "/movies/438631",
      title: "Dune",
      mediaType: "movie",
      accepted: true,
      reason: null,
      unread: true,
    });
    expect(declined).toMatchObject({ href: "/tv/1399", accepted: false, reason: "ALREADY_SEEN", unread: false });
  });

  it("ignore le motif d'une suggestion acceptée", () => {
    const [item] = buildNotificationItems({ ...empty, answers: [answer({ reason: "NOT_NOW" })] });
    expect(item).toMatchObject({ accepted: true, reason: null });
  });

  it("réaction à mon activité : mène à la fiche, garde la réaction et la note", () => {
    const [laughed, liked] = buildNotificationItems({
      ...empty,
      reactions: [
        {
          id: "r1",
          createdAt: at("2026-11-17T10:00:00Z"),
          reactor: actor("Tom"),
          reaction: "LAUGH",
          activityType: "RATED",
          rating: 9,
          title: "Dune",
          mediaType: "movie",
          tmdbId: 438631,
          read: false,
        },
        {
          id: "r2",
          createdAt: at("2026-11-17T09:00:00Z"),
          reactor: actor("Léa"),
          reaction: "LIKE",
          activityType: "WATCHLIST_ADDED",
          rating: 7,
          title: "The Bear",
          mediaType: "tv",
          tmdbId: 136315,
          read: true,
        },
      ],
    });
    expect(laughed).toEqual({
      type: "activity_reaction",
      id: "activity_reaction:r1",
      actor: actor("Tom"),
      createdAt: "2026-11-17T10:00:00.000Z",
      href: "/movies/438631",
      reaction: "LAUGH",
      title: "Dune",
      mediaType: "movie",
      activityType: "RATED",
      rating: 9,
      unread: true,
    });
    expect(liked).toMatchObject({
      href: "/tv/136315",
      reaction: "LIKE",
      activityType: "WATCHLIST_ADDED",
      rating: null,
      unread: false,
    });
  });

  it("seules les notifications enregistrées peuvent être non lues", () => {
    const items = buildNotificationItems({
      ...empty,
      friendRequests: [{ id: "f1", createdAt: at("2026-11-17T11:00:00Z"), sender: actor("Tom") }],
      answers: [answer(), answer({ id: "a2", read: true })],
    });
    expect(items.map(isUnreadNotification)).toEqual([false, true, false]);
  });

  it("borne le nombre de notifications en gardant les plus récentes", () => {
    const friendRequests = [1, 2, 3].map((day) => ({
      id: `f${day}`,
      createdAt: at(`2026-11-0${day}T00:00:00Z`),
      sender: actor("Tom"),
    }));
    expect(buildNotificationItems({ ...empty, friendRequests }, 2).map((i) => i.id)).toEqual([
      "friend_request:f3",
      "friend_request:f2",
    ]);
  });
});
