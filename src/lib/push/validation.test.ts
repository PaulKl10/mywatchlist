import { describe, expect, it } from "vitest";
import { parsePushEndpoint, parsePushSubscriptionInput } from "./validation";

const valid = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc",
  keys: { p256dh: "BNc_x-1", auth: "tBH-q_9" },
};

describe("parsePushSubscriptionInput", () => {
  it("normalise un PushSubscription.toJSON() valide", () => {
    expect(parsePushSubscriptionInput(valid)).toEqual({
      endpoint: valid.endpoint,
      p256dh: "BNc_x-1",
      auth: "tBH-q_9",
    });
  });
  it("ignore les champs supplémentaires", () => {
    expect(parsePushSubscriptionInput({ ...valid, expirationTime: null })).not.toBeNull();
  });
  it.each([
    [null],
    ["x"],
    [{}],
    [{ ...valid, endpoint: "http://fcm.googleapis.com/x" }],
    [{ ...valid, endpoint: "pas une url" }],
    [{ ...valid, endpoint: "https://a.b/" + "x".repeat(2048) }],
    [{ ...valid, keys: { p256dh: "", auth: "a" } }],
    [{ ...valid, keys: { p256dh: "a+b/c=", auth: "a" } }],
    [{ ...valid, keys: { p256dh: "a".repeat(201), auth: "a" } }],
    [{ endpoint: valid.endpoint }],
  ])("refuse %j", (body) => {
    expect(parsePushSubscriptionInput(body)).toBeNull();
  });
});

describe("parsePushEndpoint", () => {
  it("accepte un endpoint https", () => {
    expect(parsePushEndpoint({ endpoint: valid.endpoint })).toBe(valid.endpoint);
  });
  it("refuse un endpoint non https ou un corps invalide", () => {
    expect(parsePushEndpoint({ endpoint: "http://x" })).toBeNull();
    expect(parsePushEndpoint(null)).toBeNull();
  });
});
