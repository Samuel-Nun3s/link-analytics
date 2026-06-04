import type { Request, Response } from "express";
import { resolveSlug } from "./redirect.service.js";
import { enqueueClick } from "../clicks/clicks.service.js";

export async function handleRedirect(
  req: Request<{ slug: string }>,
  res: Response,
) {
  const { slug } = req.params;
  const result = await resolveSlug(slug);

  switch (result.kind) {
    case "redirect":
      enqueueClick({
        linkId: result.linkId,
        slug,
        ip: req.ip ?? "unknown",
        userAgent: req.headers["user-agent"] ?? "unknown",
        referrer: req.headers.referer ?? null,
      });
      res.redirect(302, result.originalUrl);
      return;
    case "not-found":
      res.status(404).send("Not Found");
      return;
    case "gone":
      res.status(410).send(`Gone: ${result.reason}`);
      return;
    default: {
      const _exhaustive: never = result;
      throw new Error(`Unhandled kind: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
