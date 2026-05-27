import express from "express";
import { env } from "./config/env.js";
import { healthRoutes } from "./features/health/health.routes.js";
import { redirectRoutes } from "./features/redirect/redirect.routes.js";

const app = express();

// Confia em proxies pra ler X-Forwarded-For (configurável via env)
app.set("trust proxy", env.TRUST_PROXY);

app.use(express.json());

// Rotas específicas primeiro
app.use(healthRoutes);

// Catch-all do redirect por último (matches GET /:slug)
app.use(redirectRoutes);

export { app };