import { describe, expect, it } from "vitest";
import { resolveRange } from "../../src/lib/time-range.js";

describe("resolveRange", () => {
  it("24h: 24 horas atrás, bucket=hour", () => {
    const { from, to, bucket } = resolveRange("24h");
    const diffMs = to.getTime() - from.getTime();
    expect(diffMs).toBeCloseTo(24 * 60 * 60 * 1000, -3);
    expect(bucket).toBe("hour");
  });

  it("7d: 7 dias atrás, bucket=hour", () => {
    const { from, to, bucket } = resolveRange("7d");
    const diffMs = to.getTime() - from.getTime();
    expect(diffMs).toBeCloseTo(7 * 24 * 60 * 60 * 1000, -3);
    expect(bucket).toBe("hour");
  });

  it("30d: 30 dias atrás, bucket=day", () => {
    const { from, to, bucket } = resolveRange("30d");
    expect(bucket).toBe("day");
    const diffDays = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
    expect(diffDays).toBeCloseTo(30, 0);
  });

  it("90d: 90 dias atrás, bucket=day", () => {
    const { from, to, bucket } = resolveRange("90d");
    expect(bucket).toBe("day");
    const diffDays = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
    expect(diffDays).toBeCloseTo(90, 0);
  });

  it("all: from=epoch, bucket=day", () => {
    const { from, bucket } = resolveRange("all");
    expect(from.getTime()).toBe(0);
    expect(bucket).toBe("day");
  });

  it("to é sempre 'agora' (dentro de uma janela de 1s)", () => {
    const { to } = resolveRange("7d");
    expect(Math.abs(Date.now() - to.getTime())).toBeLessThan(1000);
  });
});
