import { Router } from "express";
import { requireAdmin, requireAdminQuery } from "../auth/auth.middleware.js";
import {
  handleGetLinkAnalytics,
  handleGetOverview,
} from "./analytics.controller.js";
import { handleClickStream } from "./analytics.sse.js";

export const analyticsRoutes = Router();

// SSE precisa de auth via query (?token=) e DEVE vir antes do `use(...requireAdmin)`,
// senão a middleware de header pega o request primeiro.
analyticsRoutes.get(
  "/admin/analytics/stream",
  requireAdminQuery,
  handleClickStream,
);

// Demais rotas: auth por header. Path-scoped (lição da 3.4).
analyticsRoutes.use("/admin/analytics", requireAdmin);
analyticsRoutes.get("/admin/analytics/overview", handleGetOverview);
analyticsRoutes.get("/admin/analytics/links/:id", handleGetLinkAnalytics);
