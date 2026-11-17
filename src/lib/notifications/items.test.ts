import { describe, expect, it } from "vitest";
import { buildNotificationItems, NOTIFICATION_HREFS, type TNotificationSources } from "./items";

const actor = (name: string) => ({ name, avatarUrl: null });
const at = (iso: string) => new Date(iso);

const empty: TNotificationSources = { invites: [], friendRequests: [], suggestions: [] };

describe("buildNotificationItems", () => {
  it("ne renvoie rien sans demande en attente", () => {
    expect(buildNotificationItems(empty)).toEqual([]);
  });

  it("mélange les trois sources, de la plus récente à la plus ancienne", () => {
    const items = buildNotificationItems({
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
