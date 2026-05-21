import { prisma } from "../../config/prisma.js";
import { redis } from "../../config/redis.js";

export type HealthStatus = {
  postgres: "ok" | "down";
  redis: "ok" | "down";
};

export async function checkHealth(): Promise<HealthStatus> {
  const [pgResult, redisResult] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redis.ping(),
  ]);

  return {
    postgres: pgResult.status === "fulfilled" ? "ok" : "down",
    redis: redisResult.status === "fulfilled" ? "ok" : "down",
  };
}
