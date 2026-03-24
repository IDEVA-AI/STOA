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
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "https:", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://*.b-cdn.net"],
            connectSrc: ["'self'", "https://video.bunnycdn.com"],
            frameSrc: ["'self'", "https://iframe.mediadelivery.net"],
            fontSrc: ["'self'", "https:", "data:"],
          },
        },
      })
    );
  }
  app.use(corsMiddleware);
  app.use(express.json({ limit: "10mb" }));
  app.use("/api/", apiLimiter);
}
