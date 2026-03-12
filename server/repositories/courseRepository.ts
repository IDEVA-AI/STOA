import db from "../db/connection";
import * as lessonBlockRepo from "./lessonBlockRepository";

export function getAllCourses(workspaceId?: number) {
  if (workspaceId) {
    return db.prepare("SELECT * FROM courses WHERE workspace_id = ?").all(workspaceId);
  }
  return db.prepare("SELECT * FROM courses").all();
}

export function getByWorkspace(workspaceId: number) {
  return db.prepare("SELECT * FROM courses WHERE workspace_id = ?").all(workspaceId);
}

export function getCourseModules(courseId: number) {
  const modules = db
    .prepare(
      `SELECT m.* FROM modules m
       JOIN courses_modules cm ON cm.module_id = m.id
       WHERE cm.course_id = ?
       ORDER BY cm.position`
    )
    .all(courseId) as any[];

  for (const mod of modules) {
    mod.lessons = db
      .prepare(
        `SELECT l.* FROM lessons l
         JOIN modules_lessons ml ON ml.lesson_id = l.id
         WHERE ml.module_id = ?
         ORDER BY ml.position`
      )
      .all(mod.id) as any[];

    for (const lesson of mod.lessons) {
      lesson.blocks = lessonBlockRepo.getByLesson(lesson.id);
    }
  }

  return modules;
}
