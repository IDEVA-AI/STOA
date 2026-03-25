import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import * as repo from "../repositories/lessonInteractionRepository";

const router = Router();
router.use(authMiddleware);

// ── Ratings ──

// GET /api/lessons/:lessonId/rating
router.get("/:lessonId/rating", async (req: Request, res: Response) => {
  try {
    const stats = await repo.getRatingStats(Number(req.params.lessonId), req.userId);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lessons/:lessonId/rating
router.post("/:lessonId/rating", async (req: Request, res: Response) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be 1-5" });
    }
    const stats = await repo.upsertRating(Number(req.params.lessonId), req.userId!, rating);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Comments ──

// GET /api/lessons/:lessonId/comments
router.get("/:lessonId/comments", async (req: Request, res: Response) => {
  try {
    const comments = await repo.getComments(Number(req.params.lessonId));
    res.json(comments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lessons/:lessonId/comments
router.post("/:lessonId/comments", async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }
    const comment = await repo.createComment(Number(req.params.lessonId), req.userId!, content.trim());
    res.status(201).json(comment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/lessons/:lessonId/comments/:commentId
router.delete("/:lessonId/comments/:commentId", async (req: Request, res: Response) => {
  try {
    await repo.deleteComment(Number(req.params.commentId), req.userId!, req.userRole!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
