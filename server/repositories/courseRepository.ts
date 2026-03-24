import db from "../db/connection";
import * as lessonBlockRepo from "./lessonBlockRepository";

const COURSES_WITH_COUNT = `SELECT c.*, (
  SELECT COUNT(*) FROM courses_modules cm
  JOIN modules_lessons ml ON ml.module_id = cm.module_id
  WHERE cm.course_id = c.id
)::int AS lessons_count FROM courses c`;

export async function getAllCourses(workspaceId?: number) {
  if (workspaceId) {
    return await db.all(`${COURSES_WITH_COUNT} WHERE c.workspace_id = $1`, [workspaceId]);
  }
  return await db.all(COURSES_WITH_COUNT);
}

export async function getByWorkspace(workspaceId: number) {
  return await db.all(`${COURSES_WITH_COUNT} WHERE c.workspace_id = $1`, [workspaceId]);
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
