import { Router } from "express";
import * as adminService from "../services/adminService";

const router = Router();

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

export default router;
