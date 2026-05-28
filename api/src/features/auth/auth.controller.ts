import type { Request, Response } from "express";
import { loginSchema } from "./auth.schemas.js";
import { verifyPassword, signToken } from "./auth.service.js";

export function handleLogin(req: Request, res: Response): void {
  const { password } = loginSchema.parse(req.body);

  if (!verifyPassword(password)) {
    res.status(401).json({
      error: {
        message: "Invalid password",
        code: "UNAUTHORIZED",
      },
    });
    return;
  }

  res.json({ token: signToken() });
}
