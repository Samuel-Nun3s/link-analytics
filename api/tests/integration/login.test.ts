import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { env } from "../../src/config/env.js";
import { prisma } from "../../src/config/prisma.js";
import { redis } from "../../src/config/redis.js";

describe("POST /admin/login (integration)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
    await redis.quit();
  });

  it("retorna 400 quando o body está sem password", async () => {
    const res = await request(app)
      .post("/admin/login")
      .send({})
      .set("Content-Type", "application/json");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("retorna 401 com senha errada", async () => {
    const res = await request(app)
      .post("/admin/login")
      .send({ password: "definitivamente-errada" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("retorna 200 + token JWT válido com senha correta", async () => {
    const res = await request(app)
      .post("/admin/login")
      .send({ password: env.ADMIN_PASSWORD });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    // JWT tem 3 partes separadas por ponto
    expect(res.body.token.split(".")).toHaveLength(3);
  });

  it("endpoints /admin/links exigem Authorization Bearer", async () => {
    const res = await request(app).get("/admin/links");
    expect(res.status).toBe(401);
  });

  it("Bearer válido libera /admin/links", async () => {
    const login = await request(app)
      .post("/admin/login")
      .send({ password: env.ADMIN_PASSWORD });
    const token = login.body.token;

    const res = await request(app)
      .get("/admin/links")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.total).toBe("number");
  });
});
