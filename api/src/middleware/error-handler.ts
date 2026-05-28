import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
    });
    return;
  }

  // express.json() lança SyntaxError com status 400 quando o body não é JSON válido
  if (err instanceof SyntaxError && "status" in err && err.status === 400) {
    res.status(400).json({
      error: {
        message: "Invalid JSON in request body",
        code: "INVALID_JSON",
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        error: {
          message: "Resource already exists (unique constraint violated)",
          code: "CONFLICT",
        },
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({
        error: {
          message: "Resource not found",
          code: "NOT_FOUND",
        },
      });
      return;
    }
  }

  console.error("[error-handler]", err);
  res.status(500).json({
    error: {
      message: "Internal server error",
    },
  });
};
