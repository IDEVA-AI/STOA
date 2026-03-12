import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import * as purchaseService from "../services/purchaseService";

const router = Router();

// List current user's purchases
router.get("/my", authMiddleware, (req, res) => {
  try {
    const userId = req.userId!;
    const purchases = purchaseService.listByUser(userId);
    res.json(purchases);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// List all courseIds user has access to
router.get("/my/courses", authMiddleware, (req, res) => {
  try {
    const userId = req.userId!;
    const courseIds = purchaseService.getUserCourseIds(userId);
    res.json({ courseIds });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// Check if current user has access to a course
router.get("/check/:courseId", authMiddleware, (req, res) => {
  try {
    const userId = req.userId!;
    const courseId = Number(req.params.courseId);
    const hasAccess = purchaseService.hasAccess(userId, courseId);
    res.json({ hasAccess });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// List workspace purchases (admin)
router.get("/workspace/:workspaceId", authMiddleware, (req, res) => {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const purchases = purchaseService.listByWorkspace(workspaceId);
    res.json(purchases);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// Create purchase
router.post("/", authMiddleware, (req, res) => {
  try {
    const userId = req.userId!;
    const { product_id, workspace_id } = req.body;

    if (!product_id || !workspace_id) {
      res.status(400).json({ error: "product_id and workspace_id are required" });
      return;
    }

    const id = purchaseService.create({
      user_id: userId,
      product_id,
      workspace_id,
    });

    res.status(201).json({ id, success: true });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

// Update purchase status
router.put("/:id/status", authMiddleware, (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: "status is required" });
      return;
    }

    purchaseService.updateStatus(id, status);
    res.json({ success: true });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

export default router;
