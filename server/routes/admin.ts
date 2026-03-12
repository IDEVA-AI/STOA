import { Router } from "express";
import * as adminService from "../services/adminService";

const router = Router();

router.get("/stats", (req, res) => {
  const stats = adminService.getStats();
  const recentActivity = adminService.getRecentActivity(15);

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
