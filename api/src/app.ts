import express from "express";
import { healthRoutes } from "./features/health/health.routes.js";
import { redirectRoutes } from "./features/redirect/redirect.routes.js";

const app = express();

app.use(express.json());

// Rotas específicas primeiro
app.use(healthRoutes);

// Catch-all do redirect por último (matches GET /:slug)
app.use(redirectRoutes);

export { app };