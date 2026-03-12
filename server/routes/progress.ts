import { Router } from "express";
import * as progressService from "../services/progressService";

const router = Router();

router.get("/dashboard", (req, res) => {
  const userId = Number(req.query.userId) || 1;
  const overall = progressService.getOverallProgress(userId);
  const lastAccessed = progressService.getLastAccessedLesson(userId);
  res.json({ overall, lastAccessed });
});

export default router;
