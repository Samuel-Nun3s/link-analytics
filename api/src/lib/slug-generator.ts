import { customAlphabet } from "nanoid";

// Alfabeto sem caracteres ambíguos (0, 1, O, o, I, i, l, L) — reduz erro de digitação manual
const SLUG_ALPHABET =
  "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
const SLUG_LENGTH = 7;

const generate = customAlphabet(SLUG_ALPHABET, SLUG_LENGTH);

export function generateSlug(): string {
  return generate();
}
