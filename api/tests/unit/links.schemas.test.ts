import { describe, expect, it } from "vitest";
import {
  createLinkSchema,
  listLinksQuerySchema,
  updateLinkSchema,
} from "../../src/features/links/links.schemas.js";

describe("createLinkSchema", () => {
  it("aceita URL https válida", () => {
    const result = createLinkSchema.safeParse({
      originalUrl: "https://example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita protocolo não-http(s)", () => {
    const result = createLinkSchema.safeParse({
      originalUrl: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita URL apontando pra loopback (anti-SSRF)", () => {
    expect(createLinkSchema.safeParse({ originalUrl: "http://localhost:6379" }).success).toBe(false);
    expect(createLinkSchema.safeParse({ originalUrl: "http://127.0.0.1" }).success).toBe(false);
    expect(createLinkSchema.safeParse({ originalUrl: "http://[::1]" }).success).toBe(false);
  });

  it("rejeita IPs RFC 1918 (LAN privada)", () => {
    expect(createLinkSchema.safeParse({ originalUrl: "http://10.0.0.1" }).success).toBe(false);
    expect(createLinkSchema.safeParse({ originalUrl: "http://192.168.1.1" }).success).toBe(false);
    expect(createLinkSchema.safeParse({ originalUrl: "http://172.20.0.1" }).success).toBe(false);
  });

  it("rejeita slug com caracteres inválidos", () => {
    const result = createLinkSchema.safeParse({
      originalUrl: "https://example.com",
      slug: "tem espaço",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita slug muito curto ou muito longo", () => {
    expect(
      createLinkSchema.safeParse({ originalUrl: "https://x.com", slug: "ab" }).success,
    ).toBe(false);
    expect(
      createLinkSchema.safeParse({ originalUrl: "https://x.com", slug: "a".repeat(31) }).success,
    ).toBe(false);
  });

  it("rejeita maxClicks <= 0", () => {
    expect(
      createLinkSchema.safeParse({ originalUrl: "https://x.com", maxClicks: 0 }).success,
    ).toBe(false);
    expect(
      createLinkSchema.safeParse({ originalUrl: "https://x.com", maxClicks: -5 }).success,
    ).toBe(false);
  });

  it("rejeita expiresAt no passado", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const result = createLinkSchema.safeParse({
      originalUrl: "https://example.com",
      expiresAt: past,
    });
    expect(result.success).toBe(false);
  });

  it("aceita expiresAt no futuro", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const result = createLinkSchema.safeParse({
      originalUrl: "https://example.com",
      expiresAt: future,
    });
    expect(result.success).toBe(true);
  });
});

describe("updateLinkSchema", () => {
  it("permite expiresAt=null (limpar)", () => {
    const result = updateLinkSchema.safeParse({ expiresAt: null });
    expect(result.success).toBe(true);
  });

  it("permite expiresAt no passado (forçar expiração)", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const result = updateLinkSchema.safeParse({ expiresAt: past });
    expect(result.success).toBe(true);
  });

  it("permite update parcial (vazio = no-op válido)", () => {
    const result = updateLinkSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("listLinksQuerySchema", () => {
  it("coerce strings de query → number e aplica defaults", () => {
    const result = listLinksQuerySchema.safeParse({ limit: "50", offset: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(10);
    }
  });

  it("aplica defaults quando query vazia", () => {
    const result = listLinksQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
    }
  });

  it("rejeita limit > 100", () => {
    const result = listLinksQuerySchema.safeParse({ limit: "101" });
    expect(result.success).toBe(false);
  });
});
