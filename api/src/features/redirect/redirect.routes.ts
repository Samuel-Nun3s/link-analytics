import { Router } from "express";
import { handleRedirect } from "./redirect.controller.js";

export const redirectRoutes = Router();

redirectRoutes.get("/:slug", handleRedirect);
