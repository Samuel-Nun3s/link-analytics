import type { Request, Response } from "express";
import {
  createLinkSchema,
  listLinksQuerySchema,
  updateLinkSchema,
} from "./links.schemas.js";
import {
  createLink,
  deactivateLink,
  getLink,
  listLinks,
  updateLink,
} from "./links.service.js";

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

export async function handleGetLink(
  req: Request<{ id: string }>,
  res: Response,
) {
  const link = await getLink(req.params.id);
  res.json(link);
}

export async function handleUpdateLink(
  req: Request<{ id: string }>,
  res: Response,
) {
  const input = updateLinkSchema.parse(req.body);
  const link = await updateLink(req.params.id, input);
  res.json(link);
}

export async function handleDeactivateLink(
  req: Request<{ id: string }>,
  res: Response,
) {
  const link = await deactivateLink(req.params.id);
  res.json(link);
}
