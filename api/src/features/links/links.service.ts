import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { redis } from "../../config/redis.js";
import { generateSlug } from "../../lib/slug-generator.js";
import type {
  CreateLinkInput,
  ListLinksQuery,
  UpdateLinkInput,
} from "./links.schemas.js";

function cacheKey(slug: string) {
  return `link:${slug}`;
}

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

export async function getLink(id: string) {
  // findUniqueOrThrow lança P2025 → errorHandler converte pra 404
  return prisma.link.findUniqueOrThrow({ where: { id } });
}

export async function updateLink(id: string, input: UpdateLinkInput) {
  // Captura o slug atual ANTES do update — precisamos pra invalidar o cache antigo
  // se o slug mudar nesta operação
  const existing = await prisma.link.findUniqueOrThrow({
    where: { id },
    select: { slug: true },
  });

  // Monta o objeto data só com os campos que o admin realmente mandou.
  // `undefined` = não mexer; `null` = limpar; valor = atualizar.
  const data: Prisma.LinkUpdateInput = {};
  if (input.originalUrl !== undefined) data.originalUrl = input.originalUrl;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.expiresAt !== undefined) {
    data.expiresAt =
      input.expiresAt === null ? null : new Date(input.expiresAt);
  }
  if (input.maxClicks !== undefined) data.maxClicks = input.maxClicks;
  if (input.active !== undefined) data.active = input.active;

  const updated = await prisma.link.update({ where: { id }, data });

  // Invalida cache do slug antigo E do novo (idempotente via Set)
  const slugs = new Set([existing.slug, updated.slug]);
  await Promise.all([...slugs].map((slug) => redis.del(cacheKey(slug))));

  return updated;
}

export async function deactivateLink(id: string) {
  const link = await prisma.link.update({
    where: { id },
    data: { active: false },
  });
  // Invalida cache — sem isso o redirect continuaria servindo "active: true" do JSON cacheado
  await redis.del(cacheKey(link.slug));
  return link;
}
