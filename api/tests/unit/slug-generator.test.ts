import { describe, expect, it } from "vitest";
import { generateSlug } from "../../src/lib/slug-generator.js";

describe("generateSlug", () => {
  it("gera slug de exatamente 7 caracteres", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateSlug()).toHaveLength(7);
    }
  });

  it("usa apenas caracteres do alfabeto sem ambíguos (sem 0, 1, O, l, I, L)", () => {
    const allowed = /^[2-9a-hjkmnp-zA-HJKMN-Z]+$/;
    for (let i = 0; i < 50; i++) {
      const slug = generateSlug();
      expect(slug).toMatch(allowed);
    }
  });

  it("gera slugs únicos com alta probabilidade", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      seen.add(generateSlug());
    }
    // Em 1000 gerações com 54^7 espaço, colisão é praticamente impossível
    expect(seen.size).toBe(1000);
  });
});
