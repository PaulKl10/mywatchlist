import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./relativeTime";

const NOW = new Date("2026-11-16T12:00:00Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms);
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("formatRelativeTime", () => {
  it("à l'instant sous une minute", () => {
    expect(formatRelativeTime(ago(20_000), NOW)).toBe("à l'instant");
  });
  it("minutes, heures, jours", () => {
    expect(formatRelativeTime(ago(5 * MIN), NOW)).toBe("il y a 5 minutes");
    expect(formatRelativeTime(ago(3 * HOUR), NOW)).toBe("il y a 3 heures");
    expect(formatRelativeTime(ago(DAY + HOUR), NOW)).toBe("hier");
    expect(formatRelativeTime(ago(4 * DAY), NOW)).toBe("il y a 4 jours");
  });
  it("une date future (horloge décalée) reste « à l'instant »", () => {
    expect(formatRelativeTime(new Date(NOW.getTime() + 5 * MIN), NOW)).toBe("à l'instant");
  });
});
