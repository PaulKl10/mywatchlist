import { describe, expect, it } from "vitest";
import { isAllowedPushEndpoint, parsePushEndpoint, parsePushSubscriptionInput } from "./validation";

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

describe("isAllowedPushEndpoint", () => {
  it.each([
    "https://fcm.googleapis.com/fcm/send/abc",
    "https://updates.push.services.mozilla.com/wpush/v2/abc",
    "https://web.push.apple.com/QGx",
    "https://wns2-par02p.notify.windows.com/w/?token=abc",
  ])("accepte %s", (url) => expect(isAllowedPushEndpoint(url)).toBe(true));
  it.each([
    "http://fcm.googleapis.com/fcm/send/abc",
    "https://evil.com/fcm.googleapis.com",
    "https://fcm.googleapis.com.evil.com/x",
    "https://evilfcm.googleapis.com/x",
    "https://fcm.googleapis.com:8443/x",
    "https://user:pw@fcm.googleapis.com/x",
    "https://127.0.0.1/x",
    "https://[::1]/x",
    "https://localhost/x",
    "pas une url",
  ])("refuse %s", (url) => expect(isAllowedPushEndpoint(url)).toBe(false));
  it("est appliqué à la validation des corps", () => {
    expect(parsePushEndpoint({ endpoint: "https://evil.com/x" })).toBeNull();
    expect(
      parsePushSubscriptionInput({ ...valid, endpoint: "https://evil.com/x" })
    ).toBeNull();
  });
});
