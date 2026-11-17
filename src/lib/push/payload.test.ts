import { describe, expect, it } from "vitest";
import { buildPushPayload } from "./payload";

describe("buildPushPayload", () => {
  const answer = {
    type: "suggestion_answered" as const,
    fromName: "Léa",
    fromUserId: "u2",
    title: "Dune",
    mediaType: "movie" as const,
    tmdbId: 438631,
  };
  it("prévient l'auteur d'une suggestion acceptée", () => {
    expect(buildPushPayload({ ...answer, accepted: true, reasonLabel: null })).toEqual({
      title: "Léa a ajouté « Dune » à sa watchlist",
      body: "Votre suggestion a été acceptée.",
      url: "/movies/438631",
      tag: "suggestion-answer-u2-movie-438631",
    });
  });
  it("prévient l'auteur d'une suggestion refusée, avec le motif", () => {
    expect(
      buildPushPayload({ ...answer, mediaType: "tv", accepted: false, reasonLabel: "Déjà vu" })
    ).toEqual({
      title: "Léa a refusé « Dune »",
      body: "Motif : Déjà vu.",
      url: "/tv/438631",
      tag: "suggestion-answer-u2-tv-438631",
    });
  });
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
  it("tronque à 100 caractères le titre d'une suggestion", () => {
    const { title } = buildPushPayload({
      type: "suggestion",
      fromName: "Max",
      fromUserId: "u3",
      title: "T".repeat(150),
      mediaType: "movie",
      tmdbId: 1,
    });
    expect(title).toBe(`Max vous propose « ${"T".repeat(99)}… »`);
  });
  it("construit l'alerte d'un film arrivé sur une plateforme", () => {
    expect(
      buildPushPayload({
        type: "now_available",
        title: "Dune",
        mediaType: "movie",
        tmdbId: 438631,
        providerName: "Netflix",
      }),
    ).toEqual({
      title: "« Dune » est dispo sur Netflix",
      body: "Il est dans votre watchlist. Source : JustWatch.",
      url: "/movies/438631",
      tag: "available-movie-438631",
    });
  });
  it("regroupe les alertes de plusieurs titres", () => {
    expect(
      buildPushPayload({ type: "now_available_many", count: 3, providerNames: ["Netflix", "Max"] }),
    ).toEqual({
      title: "3 titres de votre watchlist sont dispo",
      body: "Sur Netflix, Max. Source : JustWatch.",
      url: "/watchlist",
      tag: "available-many",
    });
  });
});
