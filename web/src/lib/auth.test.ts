import { beforeEach, describe, expect, it } from "vitest";
import { clearToken, getToken, isAuthenticated, setToken } from "./auth";

describe("token storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("getToken retorna null quando não há nada salvo", () => {
    expect(getToken()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it("setToken + getToken faz roundtrip", () => {
    setToken("abc.def.ghi");
    expect(getToken()).toBe("abc.def.ghi");
    expect(isAuthenticated()).toBe(true);
  });

  it("clearToken remove o valor", () => {
    setToken("abc");
    clearToken();
    expect(getToken()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it("usa key namespaced (não polui localStorage global)", () => {
    setToken("xyz");
    const keys = Object.keys(localStorage);
    // Nossa key tem prefixo "link-analytics:"
    expect(keys.some((k) => k.startsWith("link-analytics:"))).toBe(true);
  });
});
