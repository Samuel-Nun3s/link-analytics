import { Router } from "express";
import { requireAdmin } from "../auth/auth.middleware.js";
import { handleCreateLink, handleListLinks } from "./links.controller.js";

export const linksRoutes = Router();

// Aplica o middleware uma vez — protege TODAS as rotas deste router
linksRoutes.use(requireAdmin);

linksRoutes.post("/admin/links", handleCreateLink);
linksRoutes.get("/admin/links", handleListLinks);
