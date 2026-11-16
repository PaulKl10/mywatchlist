import { describe, expect, it } from "vitest";
import {
  NOTIFICATION_TARGET_MAX_AGE_MS,
  isInternalPath,
  parseNotificationTarget,
} from "./notificationTarget";

const NOW = 1_800_000_000_000;
const stored = (url: unknown, at: unknown) => JSON.stringify({ url, at });

describe("isInternalPath", () => {
  it.each(["/", "/ce-soir", "/profile", "/movies/550?x=1"])("accepte %s", (path) => {
    expect(isInternalPath(path)).toBe(true);
  });
  it.each(["//evil.com", "https://evil.com", "ce-soir", "", "/\\evil.com"])("refuse %j", (path) => {
    expect(isInternalPath(path)).toBe(false);
  });
});

describe("parseNotificationTarget", () => {
  it("renvoie l'URL d'une cible récente", () => {
    expect(parseNotificationTarget(stored("/ce-soir", NOW - 5_000), NOW)).toBe("/ce-soir");
  });
  it("ignore une cible trop ancienne", () => {
    expect(
      parseNotificationTarget(stored("/ce-soir", NOW - NOTIFICATION_TARGET_MAX_AGE_MS - 1), NOW),
    ).toBeNull();
  });
  it("accepte une cible tout juste à la limite d'âge", () => {
    expect(
      parseNotificationTarget(stored("/profile", NOW - NOTIFICATION_TARGET_MAX_AGE_MS), NOW),
    ).toBe("/profile");
  });
  it.each([
    [null],
    ["pas du json"],
    ["[]"],
    [stored("//evil.com", NOW)],
    [stored("https://evil.com", NOW)],
    [stored(42, NOW)],
    [stored("/ce-soir", "hier")],
    [stored("/ce-soir", NOW + 120_000)], // horloge incohérente : cible dans le futur
  ])("renvoie null pour %j", (raw) => {
    expect(parseNotificationTarget(raw, NOW)).toBeNull();
  });
});
