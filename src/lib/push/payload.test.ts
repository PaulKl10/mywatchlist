import { describe, expect, it } from "vitest";
import { buildPushPayload } from "./payload";

describe("buildPushPayload", () => {
  it("construit la notification d'invitation « Ce soir ? »", () => {
    expect(buildPushPayload({ type: "movie_night_invite", fromName: "Paul", movieNightId: "mn1" })).toEqual({
      title: "Paul vous invite à « Ce soir ? »",
      body: "Rejoignez la partie pour choisir un film ensemble.",
      url: "/ce-soir",
      tag: "movie-night-mn1",
    });
  });
  it("construit la notification de demande d'ami", () => {
    expect(buildPushPayload({ type: "friend_request", fromName: "Léa", fromUserId: "u2" })).toEqual({
      title: "Léa vous a demandé en ami",
      body: "Répondez depuis votre profil.",
      url: "/profile",
      tag: "friend-request-u2",
    });
  });
  it("construit la notification de suggestion d'un film", () => {
    expect(
      buildPushPayload({
        type: "suggestion",
        fromName: "Max",
        fromUserId: "u3",
        title: "Fight Club",
        mediaType: "movie",
        tmdbId: 550,
      }),
    ).toEqual({
      title: "Max vous propose « Fight Club »",
      body: "Un film à découvrir sur votre profil.",
      url: "/profile",
      tag: "suggestion-u3-movie-550",
    });
  });
  it("parle d'une série pour une suggestion tv", () => {
    expect(
      buildPushPayload({
        type: "suggestion",
        fromName: "Max",
        fromUserId: "u3",
        title: "Dark",
        mediaType: "tv",
        tmdbId: 70523,
      }).body,
    ).toBe("Une série à découvrir sur votre profil.");
  });
});
