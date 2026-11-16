import { describe, expect, it } from "vitest";
import { getPushUiState, isIosUserAgent, urlBase64ToUint8Array } from "./pushSupport";

const base = {
  hasPushApi: true,
  isIos: false,
  isStandalone: false,
  hasServiceWorker: true,
  permission: "default" as NotificationPermission,
  subscribed: false,
};

describe("getPushUiState", () => {
  it("propose l'activation quand rien n'est bloqué", () => {
    expect(getPushUiState(base)).toBe("off");
  });

  it("détecte un appareil abonné", () => {
    expect(getPushUiState({ ...base, subscribed: true, permission: "granted" })).toBe("on");
  });

  it("détecte une permission refusée", () => {
    expect(getPushUiState({ ...base, permission: "denied" })).toBe("denied");
  });

  it("détecte l'absence de service worker", () => {
    expect(getPushUiState({ ...base, hasServiceWorker: false })).toBe("no_service_worker");
  });

  it("détecte un navigateur sans Web Push", () => {
    expect(getPushUiState({ ...base, hasPushApi: false })).toBe("unsupported");
  });

  it("propose l'installation sur iPhone dans Safari (pas de PushManager)", () => {
    expect(getPushUiState({ ...base, isIos: true, hasPushApi: false })).toBe("needs_install");
  });

  it("propose l'activation sur iOS une fois l'app installée", () => {
    expect(getPushUiState({ ...base, isIos: true, isStandalone: true })).toBe("off");
  });

  it("signale un iOS installé sans Web Push (iOS < 16.4)", () => {
    expect(
      getPushUiState({ ...base, isIos: true, isStandalone: true, hasPushApi: false })
    ).toBe("unsupported");
  });
});

describe("isIosUserAgent", () => {
  it("reconnaît un iPhone", () => {
    expect(isIosUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)", 5)).toBe(true);
  });

  it("reconnaît un iPad qui se présente comme un Mac", () => {
    expect(isIosUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe(true);
  });

  it("ne confond pas un Mac sans écran tactile", () => {
    expect(isIosUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)).toBe(false);
  });

  it("ne confond pas Android", () => {
    expect(isIosUserAgent("Mozilla/5.0 (Linux; Android 14)", 5)).toBe(false);
  });
});

describe("urlBase64ToUint8Array", () => {
  it("décode du base64url sans remplissage", () => {
    expect(Array.from(urlBase64ToUint8Array("AQID_-8"))).toEqual([1, 2, 3, 255, 239]);
  });
});
