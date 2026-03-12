import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as lessonTemplateService from "../services/lessonTemplateService";

const router = Router();
router.use(authMiddleware);

// List templates for a workspace
router.get("/workspace/:workspaceId", (req, res) => {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const templates = lessonTemplateService.listByWorkspace(workspaceId);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get template with blocks
router.get("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const template = lessonTemplateService.getById(id);
    if (!template) {
      res.status(404).json({ error: "Template not found" });
      return;
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create template
router.post("/", (req, res) => {
  try {
    const { workspace_id, name, description, thumbnail, blocks } = req.body;
    if (!workspace_id || !name) {
      res
        .status(400)
        .json({ error: "workspace_id and name are required" });
      return;
    }
    const result = lessonTemplateService.create({
      workspace_id,
      name,
      description,
      thumbnail,
      blocks,
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update template
router.put("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, thumbnail, is_default, blocks } = req.body;
    lessonTemplateService.update(id, {
      name,
      description,
      thumbnail,
      is_default,
      blocks,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete template
router.delete("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    lessonTemplateService.remove(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create template from existing lesson
router.post("/from-lesson", (req, res) => {
  try {
    const { workspace_id, lesson_id, name } = req.body;
    if (!workspace_id || !lesson_id || !name) {
      res
        .status(400)
        .json({ error: "workspace_id, lesson_id and name are required" });
      return;
    }
    const result = lessonTemplateService.createFromLesson(
      workspace_id,
      lesson_id,
      name
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Apply template to a lesson (copies blocks)
router.post("/:id/apply/:lessonId", (req, res) => {
  try {
    const templateId = Number(req.params.id);
    const lessonId = Number(req.params.lessonId);
    lessonTemplateService.applyToLesson(templateId, lessonId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
