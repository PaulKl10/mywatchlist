import { describe, expect, it } from "vitest";
import { isGonePushStatus, readVapidConfig } from "./config";

const env = {
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: "pub",
  VAPID_PRIVATE_KEY: "priv",
  VAPID_SUBJECT: "mailto:a@b.fr",
};

describe("readVapidConfig", () => {
  it("lit la configuration complète", () => {
    expect(readVapidConfig(env)).toEqual({ publicKey: "pub", privateKey: "priv", subject: "mailto:a@b.fr" });
  });
  it("accepte un sujet https", () => {
    expect(readVapidConfig({ ...env, VAPID_SUBJECT: "https://exemple.fr" })).not.toBeNull();
  });
  it("renvoie null si une variable manque ou est vide", () => {
    expect(readVapidConfig({ ...env, VAPID_PRIVATE_KEY: undefined })).toBeNull();
    expect(readVapidConfig({ ...env, NEXT_PUBLIC_VAPID_PUBLIC_KEY: "" })).toBeNull();
  });
  it("refuse un sujet sans mailto: ni https://", () => {
    expect(readVapidConfig({ ...env, VAPID_SUBJECT: "a@b.fr" })).toBeNull();
  });
});

describe("isGonePushStatus", () => {
  it("vrai pour 404 et 410", () => {
    expect([404, 410].every(isGonePushStatus)).toBe(true);
  });
  it("faux pour les autres statuts", () => {
    expect([undefined, 400, 413, 429, 500].some(isGonePushStatus)).toBe(false);
  });
});
