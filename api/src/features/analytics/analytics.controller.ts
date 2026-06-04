import type { Request, Response } from "express";
import { analyticsQuerySchema } from "./analytics.schemas.js";
import { getLinkAnalytics, getOverview } from "./analytics.service.js";

export async function handleGetOverview(req: Request, res: Response) {
  const query = analyticsQuerySchema.parse(req.query);
  const result = await getOverview(query);
  res.json(result);
}

export async function handleGetLinkAnalytics(
  req: Request<{ id: string }>,
  res: Response,
) {
  const query = analyticsQuerySchema.parse(req.query);
  const result = await getLinkAnalytics(req.params.id, query);
  res.json(result);
}
