import { Router } from "express";
import * as courseService from "../services/courseService";

const router = Router();

router.get("/", (req, res) => {
  const courses = courseService.listCourses();
  res.json(courses);
});

router.get("/:id/content", (req, res) => {
  const id = Number(req.params.id);
  console.log(`Fetching content for course ID: ${id}`);
  try {
    const modules = courseService.getCourseContent(id);
    console.log(`Found ${modules.length} modules for course ${id}`);
    res.json(modules);
  } catch (error) {
    console.error(`Error fetching course content for ${id}:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
