import { Router } from "express";
import { handleLogin } from "./auth.controller.js";

export const authRoutes = Router();

authRoutes.post("/admin/login", handleLogin);
