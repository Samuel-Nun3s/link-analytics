import { Router } from "express";
import { requireAdmin } from "../auth/auth.middleware.js";
import {
  handleCreateLink,
  handleDeactivateLink,
  handleGetLink,
  handleListLinks,
  handleUpdateLink,
} from "./links.controller.js";

export const linksRoutes = Router();

// Escopa o middleware ao prefixo /admin/links — sem o path, ele rodaria
// pra QUALQUER request que entrasse neste router (inclusive os públicos)
linksRoutes.use("/admin/links", requireAdmin);

linksRoutes.post("/admin/links", handleCreateLink);
linksRoutes.get("/admin/links", handleListLinks);
linksRoutes.get("/admin/links/:id", handleGetLink);
linksRoutes.patch("/admin/links/:id", handleUpdateLink);
linksRoutes.delete("/admin/links/:id", handleDeactivateLink);
