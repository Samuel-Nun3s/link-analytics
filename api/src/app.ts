import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { analyticsRoutes } from "./features/analytics/analytics.routes.js";
import { authRoutes } from "./features/auth/auth.routes.js";
import { healthRoutes } from "./features/health/health.routes.js";
import { linksRoutes } from "./features/links/links.routes.js";
import { redirectRoutes } from "./features/redirect/redirect.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

// Confia em proxies pra ler X-Forwarded-For (configurável via env)
app.set("trust proxy", env.TRUST_PROXY);

// CORS — permite que o frontend (web/) chame os endpoints /admin/*
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: false,
  }),
);

app.use(express.json());

// Rotas específicas primeiro
app.use(healthRoutes);
app.use(authRoutes);
app.use(linksRoutes);
app.use(analyticsRoutes);

// Catch-all do redirect por último (matches GET /:slug)
app.use(redirectRoutes);

// Error handler precisa ser o ÚLTIMO middleware registrado
app.use(errorHandler);

export { app };