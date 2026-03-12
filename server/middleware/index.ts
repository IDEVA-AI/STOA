import type { Express } from "express";
import express from "express";
import compression from "compression";
import helmet from "helmet";

import { corsMiddleware } from "./cors.js";
import { apiLimiter } from "./rateLimit.js";

export { corsMiddleware } from "./cors.js";
export { errorHandler, notFoundHandler } from "./errorHandler.js";
export { authLimiter, apiLimiter, messageLimiter } from "./rateLimit.js";

export function setupMiddleware(app: Express): void {
  app.use(compression());
  app.use(helmet());
  app.use(corsMiddleware);
  app.use(express.json({ limit: "10mb" }));
  app.use("/api/", apiLimiter);
}
