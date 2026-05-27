import { prisma } from "../../config/prisma.js";
import { lookupGeo } from "../../lib/geoip.js";
import { parseUA } from "../../lib/ua-parser.js";

export type ClickInput = {
  linkId: string;
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
  buffer.push({
    ...input,
    ...geo,
    ...ua,
    timestamp: new Date(),
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
