import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { initializeSchema } from "./db/schema";
import { seedDatabase } from "./db/seed";
import coursesRouter from "./routes/courses";
import postsRouter from "./routes/posts";

initializeSchema();
seedDatabase();

async function startServer() {
  const app = express();
  const PORT = 4747;

  app.use(express.json());

  // API Routes
  app.use("/api/courses", coursesRouter);
  app.use("/api", postsRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
