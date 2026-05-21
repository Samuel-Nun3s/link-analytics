import type { Request, Response } from "express";
import { checkHealth } from "./health.service.js";

export async function getHealth(_req: Request, res: Response) {
  const status = await checkHealth();
  const allOk = status.postgres === "ok" && status.redis === "ok";
  res.status(allOk ? 200 : 503).json(status);
}
