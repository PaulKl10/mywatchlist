import { describe, expect, it } from "vitest";
import { newProviderIds, planAvailabilityAlerts } from "./alerts";

describe("newProviderIds", () => {
  it("premier relevé : référence, aucune arrivée", () => {
    expect(newProviderIds(null, [8, 337])).toEqual([]);
  });
  it("plateformes apparues depuis le dernier relevé", () => {
    expect(newProviderIds([8], [8, 337, 119])).toEqual([337, 119]);
    expect(newProviderIds([8, 337], [8])).toEqual([]);
  });
});

describe("planAvailabilityAlerts", () => {
  const changes = [
    { mediaType: "movie" as const, tmdbId: 1, newProviderIds: [8] },
    { mediaType: "tv" as const, tmdbId: 2, newProviderIds: [337] },
  ];
  const names = new Map([
    [8, "Netflix"],
    [337, "Disney Plus"],
  ]);

  it("prévient chaque utilisateur pour les titres de sa watchlist arrivés sur ses plateformes", () => {
    const alerts = planAvailabilityAlerts(
      changes,
      [
        { userId: "a", providerIds: [8, 337], mediaType: "movie", tmdbId: 1, title: "Dune" },
        { userId: "a", providerIds: [8, 337], mediaType: "tv", tmdbId: 2, title: "The Bear" },
        { userId: "b", providerIds: [119], mediaType: "movie", tmdbId: 1, title: "Dune" },
      ],
      names
    );
    expect(alerts).toEqual(
      new Map([
        [
          "a",
          [
            { mediaType: "movie", tmdbId: 1, title: "Dune", providerName: "Netflix" },
            { mediaType: "tv", tmdbId: 2, title: "The Bear", providerName: "Disney Plus" },
          ],
        ],
      ])
    );
  });

  it("nom de plateforme inconnu : générique", () => {
    const alerts = planAvailabilityAlerts(
      [{ mediaType: "movie", tmdbId: 1, newProviderIds: [999] }],
      [{ userId: "a", providerIds: [999], mediaType: "movie", tmdbId: 1, title: "Dune" }],
      names
    );
    expect(alerts.get("a")?.[0].providerName).toBe("une de vos plateformes");
  });
});
