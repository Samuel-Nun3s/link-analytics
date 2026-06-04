import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "./auth.service.js";

declare global {
  namespace Express {
    interface Request {
      admin?: boolean;
    }
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({
      error: {
        message: "Missing or invalid Authorization header",
        code: "UNAUTHORIZED",
      },
    });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.admin = payload.admin;
    next();
  } catch {
    res.status(401).json({
      error: {
        message: "Invalid or expired token",
        code: "UNAUTHORIZED",
      },
    });
  }
}

// Variante pro SSE: EventSource do browser não permite custom headers.
// Trade-off documentado: token via query param.
export function requireAdminQuery(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = req.query.token;
  if (typeof token !== "string" || token.length === 0) {
    res.status(401).json({
      error: { message: "Missing token query param", code: "UNAUTHORIZED" },
    });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.admin = payload.admin;
    next();
  } catch {
    res.status(401).json({
      error: { message: "Invalid or expired token", code: "UNAUTHORIZED" },
    });
  }
}
