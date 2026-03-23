import "dotenv/config";
import express from "express";
// Vite imported dynamically to avoid tsx/esbuild deadlock
import { createServer as createHttpServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { initializeSchema } from "./db/schema";
import { seedDatabase } from "./db/seed";
import { setupMiddleware, errorHandler, notFoundHandler, authLimiter } from "./middleware";
import { initWebSocket } from "./ws";
import logger from "./lib/logger";
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
import schedulingRouter from "./routes/scheduling";
import followRouter from "./routes/follows";
import mediaRouter from "./routes/media";
import { getUploadsDir } from "./services/uploadService";

async function startServer() {
  await initializeSchema();
  await seedDatabase();
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

  // API Routes — public routes before catch-all postsRouter
  app.use("/api/invites", invitesRouter);
  app.use("/api/courses", coursesRouter);
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
  app.use("/api/trails", trailsRouter);
  app.use("/api/communities", communitiesRouter);
  app.use("/api/lesson-blocks", lessonBlocksRouter);
  app.use("/api/lesson-templates", lessonTemplatesRouter);
  app.use("/api/scheduling", schedulingRouter);
  app.use("/api/follows", followRouter);
  app.use("/api/media", mediaRouter);

  // postsRouter mounted last — it uses "/api" catch-all with global authMiddleware
  app.use("/api", postsRouter);

  const httpServer = createHttpServer(app);
  initWebSocket(httpServer);

  // Vite middleware for development (must be before error handlers)
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    // SPA fallback — serve index.html for non-API routes
    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api/") || req.originalUrl.startsWith("/uploads/")) {
        return next();
      }
      const html = await vite.transformIndexHtml(
        req.originalUrl,
        (await import("fs")).readFileSync(path.resolve(__dirname, "..", "index.html"), "utf-8")
      );
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    });
  } else {
    app.use(express.static(path.join(__dirname, "..", "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
    });
  }

  // Error handlers (must be after all routes and middleware)
  app.use(notFoundHandler);
  app.use(errorHandler);

  httpServer.listen(PORT, "0.0.0.0", () => {
    logger.info(`STOA running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
