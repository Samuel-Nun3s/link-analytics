import { timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export type AdminPayload = { admin: true };

export function verifyPassword(plain: string): boolean {
  const expected = Buffer.from(env.ADMIN_PASSWORD);
  const provided = Buffer.from(plain);
  // timingSafeEqual exige buffers do mesmo tamanho — checagem prévia não vaza info útil
  // (atacante já sabe o input que mandou)
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

export function signToken(): string {
  return jwt.sign({ admin: true } satisfies AdminPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): AdminPayload {
  return jwt.verify(token, env.JWT_SECRET) as AdminPayload;
}
