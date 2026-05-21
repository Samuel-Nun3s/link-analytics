import express from "express";
import { healthRoutes } from "./features/health/health.routes.js";

const app = express();

app.use(express.json());

// Routes
app.use(healthRoutes);

export { app };