import { describe, expect, it } from "vitest";
import { lookupGeo } from "../../src/lib/geoip.js";

describe("lookupGeo", () => {
  it("resolve IP público (8.8.8.8) com country US", () => {
    const result = lookupGeo("8.8.8.8");
    expect(result.country).toBe("US");
  });

  it("strip do prefixo ::ffff: pra IPv4-mapped IPv6", () => {
    // Mesmo IP, formato diferente — deve resolver igual
    const direct = lookupGeo("8.8.8.8");
    const mapped = lookupGeo("::ffff:8.8.8.8");
    expect(mapped.country).toBe(direct.country);
  });

  it("retorna null pra IPs privados/loopback", () => {
    expect(lookupGeo("127.0.0.1").country).toBeNull();
    expect(lookupGeo("192.168.1.1").country).toBeNull();
  });

  it("não lança em input lixo", () => {
    expect(() => lookupGeo("not-an-ip")).not.toThrow();
    expect(() => lookupGeo("")).not.toThrow();
  });

  it("nunca retorna string vazia em city (vira null)", () => {
    // Defesa contra geoip-lite retornar city: ""
    const result = lookupGeo("8.8.8.8");
    if (result.city !== null) {
      expect(result.city.length).toBeGreaterThan(0);
    }
  });
});
