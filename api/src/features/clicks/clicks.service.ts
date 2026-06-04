import { prisma } from "../../config/prisma.js";
import { redis } from "../../config/redis.js";
import { CLICKS_CHANNEL } from "../../config/redis-pubsub.js";
import { lookupGeo } from "../../lib/geoip.js";
import { parseUA } from "../../lib/ua-parser.js";

export type ClickInput = {
  linkId: string;
  slug: string; // usado só pra publish — não persiste (slug vive em Link)
  ip: string;
  userAgent: string;
  referrer: string | null;
};

type BufferedClick = {
  linkId: string;
  ip: string;
  userAgent: string;
  referrer: string | null;
  country: string | null;
  city: string | null;
  deviceType: string;
  browser: string;
  os: string;
  timestamp: Date;
};

const buffer: BufferedClick[] = [];

export function enqueueClick(input: ClickInput): void {
  const geo = lookupGeo(input.ip);
  const ua = parseUA(input.userAgent);
  const timestamp = new Date();

  const buffered: BufferedClick = {
    linkId: input.linkId,
    ip: input.ip,
    userAgent: input.userAgent,
    referrer: input.referrer,
    ...geo,
    ...ua,
    timestamp,
  };

  buffer.push(buffered);

  // Fire-and-forget pub/sub. Não bloqueia o redirect.
  // Payload OMITE ip (PII) — só vai pro feed dados úteis pra dashboard.
  const payload = JSON.stringify({
    slug: input.slug,
    linkId: input.linkId,
    timestamp: timestamp.toISOString(),
    country: buffered.country,
    city: buffered.city,
    deviceType: buffered.deviceType,
    browser: buffered.browser,
    os: buffered.os,
    referrer: buffered.referrer,
  });
  redis.publish(CLICKS_CHANNEL, payload).catch((err: Error) => {
    console.error("[clicks] publish failed:", err.message);
  });
}

export async function flushClicks(): Promise<number> {
  if (buffer.length === 0) return 0;

  const batch = buffer.splice(0);

  try {
    await prisma.click.createMany({ data: batch });
    return batch.length;
  } catch (err) {
    console.error(`[clicks] flush failed, dropping ${batch.length} clicks:`, err);
    return 0;
  }
}
