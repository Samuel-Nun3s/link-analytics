import { z } from "zod";

// === Átomos reusáveis ===

const slugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(30, "Slug must be at most 30 characters")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Slug can only contain letters, numbers, underscore, and dash",
  );

const safeUrlSchema = z
  .url()
  .refine(
    (url) => {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    },
    { message: "URL must use http or https protocol" },
  )
  .refine(
    (url) => {
      // hostname pode vir como "[::1]" (com colchetes) em alguns runtimes
      const host = new URL(url)
        .hostname.toLowerCase()
        .replace(/^\[|\]$/g, "");
      // Loopback
      if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
        return false;
      }
      // RFC 1918 — IPs privados IPv4
      if (/^10\./.test(host)) return false;
      if (/^192\.168\./.test(host)) return false;
      if (/^172\.(1[6-9]|2[0-9]|3[01])\./.test(host)) return false;
      // Link-local
      if (/^169\.254\./.test(host)) return false;
      return true;
    },
    { message: "URL must not point to a private or loopback address" },
  );

const futureDate = z.iso
  .datetime()
  .refine((s) => new Date(s) > new Date(), {
    message: "Date must be in the future",
  });

// === Schemas dos endpoints ===

export const createLinkSchema = z.object({
  originalUrl: safeUrlSchema,
  slug: slugSchema.optional(),
  expiresAt: futureDate.optional(),
  maxClicks: z.number().int().positive().optional(),
});

export const updateLinkSchema = z.object({
  originalUrl: safeUrlSchema.optional(),
  slug: slugSchema.optional(),
  // Update permite data passada (pra "expirar agora") ou null (limpar)
  expiresAt: z.iso.datetime().nullable().optional(),
  maxClicks: z.number().int().positive().nullable().optional(),
  active: z.boolean().optional(),
});

export const listLinksQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
export type ListLinksQuery = z.infer<typeof listLinksQuerySchema>;
