import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as announcementService from "../services/announcementService";

const router = Router();

// ── User-facing (auth required) ────────────────────────────────────────

router.get("/pending", authMiddleware, (req, res) => {
  const userId = req.userId!;
  const pending = announcementService.getPendingForUser(userId);
  res.json(pending);
});

router.post("/:id/confirm", authMiddleware, (req, res) => {
  const userId = req.userId!;
  const announcementId = Number(req.params.id);

  if (isNaN(announcementId)) {
    res.status(400).json({ error: "Invalid announcement ID" });
    return;
  }

  announcementService.confirm(announcementId, userId);
  res.json({ success: true });
});

// ── Admin endpoints ────────────────────────────────────────────────────

function requireAdmin(req: any, res: any, next: any) {
  if (req.userRole !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

router.get("/", authMiddleware, requireAdmin, (_req, res) => {
  const announcements = announcementService.getAll();
  res.json(announcements);
});

router.get("/:id", authMiddleware, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const announcement = announcementService.getById(id);

  if (!announcement) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }

  res.json(announcement);
});

router.post("/", authMiddleware, requireAdmin, (req, res) => {
  const { title, type, priority, frequency, target, is_active, expires_at, blocks } = req.body;

  if (!title) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const announcement = announcementService.create({
    title,
    type,
    priority,
    frequency,
    target,
    is_active,
    expires_at,
    blocks,
  });

  res.status(201).json(announcement);
});

router.put("/:id", authMiddleware, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { title, type, priority, frequency, target, is_active, expires_at, blocks } = req.body;

  if (!title) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const existing = announcementService.getById(id);
  if (!existing) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }

  const announcement = announcementService.update(id, {
    title,
    type,
    priority,
    frequency,
    target,
    is_active,
    expires_at,
    blocks,
  });

  res.json(announcement);
});

router.delete("/:id", authMiddleware, requireAdmin, (req, res) => {
  const id = Number(req.params.id);

  const existing = announcementService.getById(id);
  if (!existing) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }

  announcementService.remove(id);
  res.json({ success: true });
});

export default router;
