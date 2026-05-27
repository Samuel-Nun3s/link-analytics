import { prisma } from "../../config/prisma.js";
import { redis } from "../../config/redis.js";
import { flushClicks } from "./clicks.service.js";

const TICK_MS = 5000;
const COUNTER_PREFIX = "clickcount:";

let intervalHandle: NodeJS.Timeout | null = null;
let tickInFlight = false;

async function syncCounters(): Promise<void> {
  const stream = redis.scanStream({ match: `${COUNTER_PREFIX}*` });

  for await (const keys of stream) {
    for (const key of keys as string[]) {
      const slug = key.slice(COUNTER_PREFIX.length);
      const raw = await redis.get(key);
      const n = raw ? parseInt(raw, 10) : 0;
      if (n <= 0) continue;

      try {
        await prisma.link.update({
          where: { slug },
          data: { clickCount: { increment: n } },
        });
        await redis.decrby(key, n);
      } catch (err) {
        console.error(`[clicks-worker] counter sync failed for ${slug}:`, err);
      }
    }
  }
}

async function tick(): Promise<void> {
  if (tickInFlight) return;
  tickInFlight = true;
  try {
    const flushed = await flushClicks();
    if (flushed > 0) {
      console.log(`[clicks-worker] flushed ${flushed} clicks`);
    }
    await syncCounters();
  } catch (err) {
    console.error("[clicks-worker] tick failed:", err);
  } finally {
    tickInFlight = false;
  }
}

export function startClicksWorker(): void {
  if (intervalHandle !== null) return;
  intervalHandle = setInterval(tick, TICK_MS);
  console.log(`[clicks-worker] started (tick every ${TICK_MS}ms)`);
}

export async function stopClicksWorker(): Promise<void> {
  if (intervalHandle === null) return;
  clearInterval(intervalHandle);
  intervalHandle = null;
  await flushClicks();
  await syncCounters();
  console.log("[clicks-worker] stopped");
}
