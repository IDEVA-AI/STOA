import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as trailService from "../services/trailService";

const router = Router();
router.use(authMiddleware);

// List trails for workspace
router.get("/workspace/:workspaceId", (req, res) => {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const trails = trailService.listByWorkspace(workspaceId);
    res.json(trails);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get trail with courses
router.get("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const trail = trailService.getWithCourses(id);
    if (!trail) {
      res.status(404).json({ error: "Trail not found" });
      return;
    }
    res.json(trail);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create trail
router.post("/", (req, res) => {
  try {
    const { workspace_id, title, description, thumbnail, is_published, courseIds } = req.body;
    if (!workspace_id || !title) {
      res.status(400).json({ error: "workspace_id and title are required" });
      return;
    }
    const result = trailService.create({ workspace_id, title, description, thumbnail, is_published, courseIds });
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update trail
router.put("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, description, thumbnail, is_published, courseIds } = req.body;
    trailService.update(id, { title, description, thumbnail, is_published, courseIds });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete trail
router.delete("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    trailService.remove(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Set courses for trail
router.post("/:id/courses", (req, res) => {
  try {
    const trailId = Number(req.params.id);
    const { courseIds } = req.body;
    if (!Array.isArray(courseIds)) {
      res.status(400).json({ error: "courseIds must be an array" });
      return;
    }
    trailService.setCourses(trailId, courseIds);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reorder courses in trail
router.put("/:id/courses/reorder", (req, res) => {
  try {
    const trailId = Number(req.params.id);
    const { courseIds } = req.body;
    if (!Array.isArray(courseIds)) {
      res.status(400).json({ error: "courseIds must be an array" });
      return;
    }
    trailService.reorderCourses(trailId, courseIds);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
