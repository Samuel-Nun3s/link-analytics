import type { Request, Response } from "express";
import { createLinkSchema, listLinksQuerySchema } from "./links.schemas.js";
import { createLink, listLinks } from "./links.service.js";

export async function handleCreateLink(req: Request, res: Response) {
  const input = createLinkSchema.parse(req.body);
  const link = await createLink(input);
  res.status(201).json(link);
}

export async function handleListLinks(req: Request, res: Response) {
  const query = listLinksQuerySchema.parse(req.query);
  const result = await listLinks(query);
  res.json(result);
}
