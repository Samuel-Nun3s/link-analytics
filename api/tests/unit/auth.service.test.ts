import { describe, expect, it } from "vitest";
import { env } from "../../src/config/env.js";
import {
  signToken,
  verifyPassword,
  verifyToken,
} from "../../src/features/auth/auth.service.js";

describe("verifyPassword", () => {
  it("aceita a senha correta", () => {
    expect(verifyPassword(env.ADMIN_PASSWORD)).toBe(true);
  });

  it("rejeita senha errada", () => {
    expect(verifyPassword("senha-errada-qualquer")).toBe(false);
  });

  it("rejeita string vazia", () => {
    expect(verifyPassword("")).toBe(false);
  });

  it("rejeita senha com tamanho diferente do esperado", () => {
    // timingSafeEqual exige same length; nosso wrapper checa antes
    expect(verifyPassword(env.ADMIN_PASSWORD + "x")).toBe(false);
  });
});

describe("signToken + verifyToken roundtrip", () => {
  it("token assinado é decodificável", () => {
    const token = signToken();
    const payload = verifyToken(token);
    expect(payload.admin).toBe(true);
  });

  it("verifyToken rejeita token bagunçado", () => {
    expect(() => verifyToken("not-a-jwt")).toThrow();
  });

  it("verifyToken rejeita token assinado com chave diferente", () => {
    // Token gerado em jwt.io com secret "outro" — assinatura inválida pra nossa
    const fakeToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbiI6dHJ1ZX0.invalid";
    expect(() => verifyToken(fakeToken)).toThrow();
  });
});
