import { describe, expect, it } from "vitest";
import { MovieNightApiError } from "../services/movie-night.service";
import { decisionErrorMessage, isStaleDecisionError } from "./errors";

const apiError = (code: ConstructorParameters<typeof MovieNightApiError>[0], status = 409) =>
  new MovieNightApiError(code, `Erreur ${code}.`, status);

describe("isStaleDecisionError", () => {
  it("wrong_status et forbidden : décision périmée", () => {
    expect(isStaleDecisionError(apiError("wrong_status"))).toBe(true);
    expect(isStaleDecisionError(apiError("forbidden", 403))).toBe(true);
  });
  it("autres erreurs : affichées", () => {
    expect(isStaleDecisionError(apiError("not_finished"))).toBe(false);
    expect(isStaleDecisionError(apiError("network", 0))).toBe(false);
    expect(isStaleDecisionError(new Error("wrong_status"))).toBe(false);
    expect(isStaleDecisionError(null)).toBe(false);
  });
});

describe("decisionErrorMessage", () => {
  it("masque une erreur périmée, garde les autres messages", () => {
    expect(decisionErrorMessage(apiError("wrong_status"))).toBeNull();
    expect(decisionErrorMessage(apiError("forbidden", 403))).toBeNull();
    expect(decisionErrorMessage(apiError("no_movies", 422))).toBe("Erreur no_movies.");
    expect(decisionErrorMessage(null)).toBeNull();
  });
});
