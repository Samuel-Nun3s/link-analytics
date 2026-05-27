import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { redis } from "./config/redis.js";
import {
  startClicksWorker,
  stopClicksWorker,
} from "./features/clicks/clicks.worker.js";

async function bootstrap() {
  await prisma.$connect();
  console.log("[prisma] connected");

  await redis.ping();
  console.log("[redis] ready");

  startClicksWorker();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n[shutdown] received ${signal}, closing...`);
    server.close();
    await stopClicksWorker();
    await prisma.$disconnect();
    await redis.quit();
    console.log("[shutdown] done");
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch((err) => {
  console.error("[bootstrap] failed:", err);
  process.exit(1);
});
