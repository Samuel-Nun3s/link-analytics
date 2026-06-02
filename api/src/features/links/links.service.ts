import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { generateSlug } from "../../lib/slug-generator.js";
import type { CreateLinkInput, ListLinksQuery } from "./links.schemas.js";

const MAX_SLUG_RETRIES = 5;

export async function createLink(input: CreateLinkInput) {
  // Slug custom: passa direto. Colisão (P2002) propaga e vira 409 no errorHandler.
  if (input.slug) {
    return prisma.link.create({
      data: {
        slug: input.slug,
        originalUrl: input.originalUrl,
        customSlug: true,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        maxClicks: input.maxClicks ?? null,
      },
    });
  }

  // Slug auto-gerado: tenta até MAX_SLUG_RETRIES vezes em caso de colisão
  for (let attempt = 0; attempt < MAX_SLUG_RETRIES; attempt++) {
    try {
      return await prisma.link.create({
        data: {
          slug: generateSlug(),
          originalUrl: input.originalUrl,
          customSlug: false,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          maxClicks: input.maxClicks ?? null,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        continue; // colisão — tenta outro slug
      }
      throw err;
    }
  }

  throw new Error(
    `Could not generate a unique slug after ${MAX_SLUG_RETRIES} retries`,
  );
}

export async function listLinks(query: ListLinksQuery) {
  const [items, total] = await Promise.all([
    prisma.link.findMany({
      orderBy: { createdAt: "desc" },
      skip: query.offset,
      take: query.limit,
    }),
    prisma.link.count(),
  ]);

  return {
    items,
    total,
    limit: query.limit,
    offset: query.offset,
  };
}
