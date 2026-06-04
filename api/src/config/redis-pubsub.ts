import { EventEmitter } from "node:events";
import { Redis } from "ioredis";
import { env } from "./env.js";

export const CLICKS_CHANNEL = "clicks";

// EventEmitter local — N conexões SSE escutam aqui em vez de cada uma criar
// um Redis subscriber. Um único client Redis subscribed serve todas.
export const clickBus = new EventEmitter();
clickBus.setMaxListeners(0); // sem warning quando muitos admins conectam

const globalForSub = globalThis as unknown as {
  redisSub: Redis | undefined;
};

const redisSub =
  globalForSub.redisSub ??
  new Redis(env.REDIS_URL, {
    // Subscribers precisam reconectar indefinidamente — sem retry limit
    maxRetriesPerRequest: null,
    lazyConnect: false,
  });

if (env.NODE_ENV !== "production") {
  globalForSub.redisSub = redisSub;
}

redisSub.subscribe(CLICKS_CHANNEL).catch((err: Error) => {
  console.error("[redis-sub] subscribe failed:", err.message);
});

redisSub.on("message", (channel, message) => {
  if (channel === CLICKS_CHANNEL) {
    clickBus.emit("click", message);
  }
});

redisSub.on("error", (err: Error) => {
  console.error("[redis-sub] connection error:", err.message);
});

redisSub.on("connect", () => {
  if (env.NODE_ENV === "development") {
    console.log("[redis-sub] connected");
  }
});
