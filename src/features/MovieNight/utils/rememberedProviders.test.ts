import { afterEach, describe, expect, it, vi } from "vitest";
import {
  REMEMBERED_PROVIDERS_KEY,
  loadRememberedProviderIds,
  readRememberedProviderIds,
  saveRememberedProviderIds,
} from "./rememberedProviders";

describe("readRememberedProviderIds", () => {
  it("relit une liste d'ids", () => {
    expect(readRememberedProviderIds("[8,337]")).toEqual([8, 337]);
  });

  it.each([[null], ["pas du json"], ['{"a":1}'], ['[8,"x"]'], ["[0]"], ["[8.5]"]])(
    "renvoie [] pour %j",
    (raw) => {
      expect(readRememberedProviderIds(raw)).toEqual([]);
    },
  );
});

describe("load/saveRememberedProviderIds", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("aller-retour par le localStorage", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    });
    saveRememberedProviderIds([8, 337]);
    expect(store.get(REMEMBERED_PROVIDERS_KEY)).toBe("[8,337]");
    expect(loadRememberedProviderIds()).toEqual([8, 337]);
  });

  it("stockage qui lève : [] et aucune exception", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("bloqué");
      },
      setItem: () => {
        throw new Error("bloqué");
      },
    });
    expect(loadRememberedProviderIds()).toEqual([]);
    expect(() => saveRememberedProviderIds([8])).not.toThrow();
  });

  it("localStorage absent : [] et aucune exception", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(loadRememberedProviderIds()).toEqual([]);
    expect(() => saveRememberedProviderIds([8])).not.toThrow();
  });
});
