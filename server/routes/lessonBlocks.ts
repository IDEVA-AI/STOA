import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as lessonBlockService from "../services/lessonBlockService";

const router = Router();
router.use(authMiddleware);

// Get all blocks for a lesson (ordered by position)
router.get("/lesson/:lessonId", (req, res) => {
  try {
    const lessonId = Number(req.params.lessonId);
    const blocks = lessonBlockService.getByLesson(lessonId);
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single block
router.get("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const block = lessonBlockService.getById(id);
    if (!block) {
      res.status(404).json({ error: "Block not found" });
      return;
    }
    res.json(block);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create block
router.post("/", (req, res) => {
  try {
    const { lesson_id, block_type, content, position } = req.body;
    if (!lesson_id || !block_type) {
      res.status(400).json({ error: "lesson_id and block_type are required" });
      return;
    }
    const result = lessonBlockService.create({
      lesson_id,
      block_type,
      content: content || {},
      position: position ?? 0,
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update block
router.put("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const { block_type, content, position } = req.body;
    lessonBlockService.update(id, { block_type, content, position });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete block
router.delete("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    lessonBlockService.remove(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reorder blocks for a lesson
router.post("/lesson/:lessonId/reorder", (req, res) => {
  try {
    const lessonId = Number(req.params.lessonId);
    const { blockIds } = req.body;
    if (!Array.isArray(blockIds)) {
      res.status(400).json({ error: "blockIds must be an array" });
      return;
    }
    lessonBlockService.reorder(lessonId, blockIds);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Set all blocks at once for a lesson
router.put("/lesson/:lessonId/batch", (req, res) => {
  try {
    const lessonId = Number(req.params.lessonId);
    const { blocks } = req.body;
    if (!Array.isArray(blocks)) {
      res.status(400).json({ error: "blocks must be an array" });
      return;
    }
    const ids = lessonBlockService.setBlocks(lessonId, blocks);
    res.json({ ids });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
