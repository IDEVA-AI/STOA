import { Router } from "express";
import * as progressService from "../services/progressService";

const router = Router();

router.get("/dashboard", async (req, res) => {
  const userId = Number(req.query.userId) || 1;
  const overall = await progressService.getOverallProgress(userId);
  const lastAccessed = await progressService.getLastAccessedLesson(userId);
  res.json({ overall, lastAccessed });
});

export default router;
