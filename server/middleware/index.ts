import type { Express } from "express";
import express from "express";
import compression from "compression";
import helmet from "helmet";

import { corsMiddleware } from "./cors";
import { apiLimiter } from "./rateLimit";

export { corsMiddleware } from "./cors";
export { errorHandler, notFoundHandler } from "./errorHandler";
export { authLimiter, apiLimiter, messageLimiter } from "./rateLimit";

export function setupMiddleware(app: Express): void {
  app.use(compression());
  if (process.env.NODE_ENV === "production") {
    app.use(helmet());
  }
  app.use(corsMiddleware);
  app.use(express.json({ limit: "10mb" }));
  app.use("/api/", apiLimiter);
}
