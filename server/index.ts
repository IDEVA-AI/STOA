import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { initializeSchema } from "./db/schema";
import { seedDatabase } from "./db/seed";
import { setupMiddleware, errorHandler, notFoundHandler, authLimiter } from "./middleware";
import authRouter from "./routes/auth";
import coursesRouter from "./routes/courses";
import postsRouter from "./routes/posts";
import progressRouter from "./routes/progress";
import searchRouter from "./routes/search";
import adminRouter from "./routes/admin";
import messagesRouter from "./routes/messages";

initializeSchema();
seedDatabase();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "4747", 10);

  // Middleware stack (compression, helmet, cors, json parser, rate limit)
  setupMiddleware(app);

  // Auth routes (with stricter rate limit)
  app.use("/api/auth", authLimiter, authRouter);

  // API Routes
  app.use("/api/courses", coursesRouter);
  app.use("/api", postsRouter);
  app.use("/api/progress", progressRouter);
  app.use("/api/search", searchRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/messages", messagesRouter);

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`STOA running on http://localhost:${PORT}`);
  });
}

startServer();
