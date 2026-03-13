import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { initializeSchema } from "./db/schema";
import { seedDatabase } from "./db/seed";
import { setupMiddleware, errorHandler, notFoundHandler, authLimiter } from "./middleware";
import { initWebSocket } from "./ws";
import logger from "./lib/logger.js";
import authRouter from "./routes/auth";
import coursesRouter from "./routes/courses";
import postsRouter from "./routes/posts";
import progressRouter from "./routes/progress";
import searchRouter from "./routes/search";
import adminRouter from "./routes/admin";
import adminCrudRouter from "./routes/adminCrud";
import messagesRouter from "./routes/messages";
import uploadRouter from "./routes/upload";
import profileRouter from "./routes/profile";
import announcementsRouter from "./routes/announcements";
import workspacesRouter from "./routes/workspaces";
import productsRouter from "./routes/products";
import purchasesRouter from "./routes/purchases";
import invitesRouter from "./routes/invites";
import trailsRouter from "./routes/trails";
import communitiesRouter from "./routes/communities";
import lessonBlocksRouter from "./routes/lessonBlocks";
import lessonTemplatesRouter from "./routes/lessonTemplates";
import { getUploadsDir } from "./services/uploadService";

initializeSchema();
seedDatabase();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "4747", 10);

  // Middleware stack (compression, helmet, cors, json parser, rate limit)
  setupMiddleware(app);

  // Request logging for API routes
  app.use("/api/", (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      logger.info({
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: Date.now() - start,
      });
    });
    next();
  });

  // Auth routes (with stricter rate limit)
  app.use("/api/auth", authLimiter, authRouter);

  // API Routes
  app.use("/api/courses", coursesRouter);
  app.use("/api", postsRouter);
  app.use("/api/progress", progressRouter);
  app.use("/api/search", searchRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/admin/crud", adminCrudRouter);
  app.use("/api/messages", messagesRouter);
  app.use("/api/upload", uploadRouter);

  // Serve uploaded files (images, videos, documents) from persistent volume
  app.use("/uploads", express.static(getUploadsDir(), {
    maxAge: "7d",
    immutable: true,
  }));
  app.use("/api/profile", profileRouter);
  app.use("/api/announcements", announcementsRouter);
  app.use("/api/workspaces", workspacesRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/purchases", purchasesRouter);
  app.use("/api/invites", invitesRouter);
  app.use("/api/trails", trailsRouter);
  app.use("/api/communities", communitiesRouter);
  app.use("/api/lesson-blocks", lessonBlocksRouter);
  app.use("/api/lesson-templates", lessonTemplatesRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "..", "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
    });
  }

  // Error handlers (must be after routes)
  app.use(notFoundHandler);
  app.use(errorHandler);

  const httpServer = createHttpServer(app);
  initWebSocket(httpServer);

  httpServer.listen(PORT, "0.0.0.0", () => {
    logger.info(`STOA running on http://localhost:${PORT}`);
  });
}

startServer();
