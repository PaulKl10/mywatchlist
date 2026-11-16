import { describe, expect, it } from "vitest";
import { formatDecade, formatWatchTime } from "./format";

describe("formatDecade", () => {
  it("années 90 au XXe siècle, années 2010 ensuite", () => {
    expect(formatDecade(1990)).toBe("Les années 90");
    expect(formatDecade(1960)).toBe("Les années 60");
    expect(formatDecade(2010)).toBe("Les années 2010");
    expect(formatDecade(1910)).toBe("Les années 1910");
  });
});

describe("formatWatchTime", () => {
  it("minutes sous une heure, heures ensuite", () => {
    expect(formatWatchTime(45)).toBe("45 min");
    expect(formatWatchTime(125)).toBe("2 h");
    expect(formatWatchTime(60 * 1234)).toBe("1 234 h");
  });
});
