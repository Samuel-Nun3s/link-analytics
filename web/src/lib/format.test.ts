import { describe, expect, it } from "vitest";
import { formatNumber, truncateMiddle, formatShortUrl } from "./format";

describe("formatNumber", () => {
  it("formata milhares com separador pt-BR", () => {
    expect(formatNumber(1234)).toBe("1.234");
    expect(formatNumber(1_000_000)).toBe("1.000.000");
  });

  it("formata zero e números pequenos sem alteração", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(42)).toBe("42");
  });
});

describe("truncateMiddle", () => {
  it("retorna string original se cabe no max", () => {
    expect(truncateMiddle("curto", 10)).toBe("curto");
  });

  it("trunca no meio preservando começo e fim", () => {
    const long = "https://exemplo.com/com/url/muito/longa/que/precisa/cortar";
    const out = truncateMiddle(long, 30);
    expect(out.length).toBeLessThanOrEqual(30);
    expect(out).toContain("...");
    expect(out.startsWith("https://")).toBe(true);
  });

  it("usa default de 50 chars quando não passa max", () => {
    const s = "a".repeat(100);
    expect(truncateMiddle(s).length).toBeLessThanOrEqual(50);
  });
});

describe("formatShortUrl", () => {
  it("concatena BASE_URL com o slug", () => {
    expect(formatShortUrl("abc123")).toMatch(/\/abc123$/);
  });
});
