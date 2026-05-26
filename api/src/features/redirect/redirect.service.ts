import { prisma } from "../../config/prisma.js";
import { redis } from "../../config/redis.js";

type CachedLink = {
  originalUrl: string;
  expiresAt: string | null;
  maxClicks: number | null;
  active: boolean;
};

export type RedirectResult =
  | { kind: "redirect"; originalUrl: string }
  | { kind: "not-found" }
  | { kind: "gone"; reason: "expired" | "inactive" | "max-clicks" };

const CACHE_TTL_SECONDS = 86400; // 24h sliding

function cacheKey(slug: string) {
  return `link:${slug}`;
}

function counterKey(slug: string) {
  return `clickcount:${slug}`;
}

async function getCached(slug: string): Promise<CachedLink | null> {
  const raw = await redis.getex(cacheKey(slug), "EX", CACHE_TTL_SECONDS);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CachedLink;
  } catch {
    await redis.del(cacheKey(slug));
    return null;
  }
}

async function populateCache(slug: string): Promise<CachedLink | null> {
  const link = await prisma.link.findUnique({
    where: { slug },
    select: {
      originalUrl: true,
      expiresAt: true,
      maxClicks: true,
      active: true,
    },
  });
  if (!link) return null;

  const payload: CachedLink = {
    originalUrl: link.originalUrl,
    expiresAt: link.expiresAt?.toISOString() ?? null,
    maxClicks: link.maxClicks,
    active: link.active,
  };

  await redis.set(
    cacheKey(slug),
    JSON.stringify(payload),
    "EX",
    CACHE_TTL_SECONDS,
  );
  return payload;
}

export async function resolveSlug(slug: string): Promise<RedirectResult> {
  let cached = await getCached(slug);
  if (!cached) {
    cached = await populateCache(slug);
    if (!cached) return { kind: "not-found" };
  }

  if (!cached.active) {
    return { kind: "gone", reason: "inactive" };
  }

  if (cached.expiresAt && new Date(cached.expiresAt) <= new Date()) {
    return { kind: "gone", reason: "expired" };
  }

  const newCount = await redis.incr(counterKey(slug));
  if (cached.maxClicks !== null && newCount > cached.maxClicks) {
    await redis.del(cacheKey(slug));
    return { kind: "gone", reason: "max-clicks" };
  }

  return { kind: "redirect", originalUrl: cached.originalUrl };
}
