import db from "../db/connection";
import * as lessonBlockRepo from "./lessonBlockRepository";

export async function getAllCourses(workspaceId?: number) {
  if (workspaceId) {
    return await db.all("SELECT * FROM courses WHERE workspace_id = $1", [workspaceId]);
  }
  return await db.all("SELECT * FROM courses");
}

export async function getByWorkspace(workspaceId: number) {
  return await db.all("SELECT * FROM courses WHERE workspace_id = $1", [workspaceId]);
}

export async function getCourseModules(courseId: number) {
  const modules = await db.all(
    `SELECT m.* FROM modules m
     JOIN courses_modules cm ON cm.module_id = m.id
     WHERE cm.course_id = $1
     ORDER BY cm.position`,
    [courseId]
  ) as any[];

  for (const mod of modules) {
    mod.lessons = await db.all(
      `SELECT l.* FROM lessons l
       JOIN modules_lessons ml ON ml.lesson_id = l.id
       WHERE ml.module_id = $1
       ORDER BY ml.position`,
      [mod.id]
    ) as any[];

    for (const lesson of mod.lessons) {
      lesson.blocks = await lessonBlockRepo.getByLesson(lesson.id);
    }
  }

  return modules;
}
