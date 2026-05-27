import { prisma } from "../../config/prisma.js";

export type ClickInput = {
  linkId: string;
  ip: string;
  userAgent: string;
  referrer: string | null;
};

type BufferedClick = ClickInput & {
  timestamp: Date;
};

const buffer: BufferedClick[] = [];

export function enqueueClick(input: ClickInput): void {
  buffer.push({ ...input, timestamp: new Date() });
}

export async function flushClicks(): Promise<number> {
  if (buffer.length === 0) return 0;

  // splice(0) é atômico no event loop: pega tudo e zera o buffer
  // novas chamadas a enqueueClick durante o await caem num buffer vazio
  const batch = buffer.splice(0);

  try {
    await prisma.click.createMany({
      data: batch.map((c) => ({
        linkId: c.linkId,
        ip: c.ip,
        userAgent: c.userAgent,
        referrer: c.referrer,
        country: null, // preenchido em 2.5 (geoip)
        city: null, // preenchido em 2.5 (geoip)
        deviceType: "unknown", // preenchido em 2.5 (ua-parser)
        browser: "unknown", // preenchido em 2.5 (ua-parser)
        os: "unknown", // preenchido em 2.5 (ua-parser)
        timestamp: c.timestamp,
      })),
    });
    return batch.length;
  } catch (err) {
    console.error(`[clicks] flush failed, dropping ${batch.length} clicks:`, err);
    return 0;
  }
}
