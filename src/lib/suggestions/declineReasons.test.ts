import { describe, expect, it } from "vitest";
import { DECLINE_REASONS, declineReasonLabel, parseDeclineReason } from "./declineReasons";

describe("parseDeclineReason", () => {
  it.each(DECLINE_REASONS.map((r) => r.code))("accepte %s", (code) => {
    expect(parseDeclineReason(code)).toBe(code);
  });

  it.each([undefined, null, "", "already_seen", 1, { code: "ALREADY_SEEN" }])(
    "refuse %j",
    (value) => {
      expect(parseDeclineReason(value)).toBeNull();
    }
  );
});

describe("declineReasonLabel", () => {
  it("donne le libellé d'un motif", () => {
    expect(declineReasonLabel("ALREADY_SEEN")).toBe("Déjà vu");
    expect(declineReasonLabel("NOT_FOR_ME")).toBe("J'aime pas");
  });

  it("renvoie null pour un motif inconnu", () => {
    expect(declineReasonLabel("SUPPRIMÉ")).toBeNull();
    expect(declineReasonLabel(null)).toBeNull();
  });
});
