import { Router, Request, Response, NextFunction } from "express";
import * as adminService from "../services/adminService";
import * as passwordResetService from "../services/passwordResetService";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// All admin routes require authentication
router.use(authMiddleware);

// Admin role guard middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.userRole !== "admin") {
    res.status(403).json({ error: "Acesso restrito a administradores" });
    return;
  }
  next();
}

router.get("/stats", async (req, res) => {
  const stats = await adminService.getStats();
  const recentActivity = await adminService.getRecentActivity(15);
  res.json({
    kpis: {
      members: stats.total_users,
      courses: stats.total_courses,
      completedLessons: stats.total_completed_lessons,
      posts: stats.total_posts,
    },
    recentActivity,
  });
});

router.post("/reset-password", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: "userId e obrigatorio" });
      return;
    }
    const token = await passwordResetService.generateResetToken(userId, req.userId!);
    res.json({ token });
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  }
});

export default router;
