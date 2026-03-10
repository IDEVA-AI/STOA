import db from "../db/connection";

export function getAllCourses() {
  return db.prepare("SELECT * FROM courses").all();
}

export function getCourseModules(courseId: number) {
  const modules = db.prepare('SELECT * FROM modules WHERE course_id = ? ORDER BY "order" ASC').all(courseId) as any[];

  for (const mod of modules) {
    mod.lessons = db.prepare('SELECT * FROM lessons WHERE module_id = ? ORDER BY "order" ASC').all(mod.id);
  }

  return modules;
}
