import express from "express";
import { env } from "./config/env.js";
import { authRoutes } from "./features/auth/auth.routes.js";
import { healthRoutes } from "./features/health/health.routes.js";
import { redirectRoutes } from "./features/redirect/redirect.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

// Confia em proxies pra ler X-Forwarded-For (configurável via env)
app.set("trust proxy", env.TRUST_PROXY);

app.use(express.json());

// Rotas específicas primeiro
app.use(healthRoutes);
app.use(authRoutes);

// Catch-all do redirect por último (matches GET /:slug)
app.use(redirectRoutes);

// Error handler precisa ser o ÚLTIMO middleware registrado
app.use(errorHandler);

export { app };