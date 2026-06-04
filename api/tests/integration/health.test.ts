import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/config/prisma.js";
import { redis } from "../../src/config/redis.js";

describe("GET /health (integration)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
    await redis.quit();
  });

  it("retorna 200 com Postgres e Redis OK", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ postgres: "ok", redis: "ok" });
  });
});
