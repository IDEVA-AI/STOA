import db from "../db/connection";

// ── Courses ──────────────────────────────────────────────────────────

export interface AdminCourseRow {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  module_count: number;
  lesson_count: number;
}

export function listCourses(): AdminCourseRow[] {
  return db
    .prepare(
      `SELECT
        c.id,
        c.title,
        c.description,
        c.thumbnail,
        (SELECT COUNT(*) FROM courses_modules cm WHERE cm.course_id = c.id) AS module_count,
        (SELECT COUNT(*) FROM modules_lessons ml
         JOIN courses_modules cm ON cm.module_id = ml.module_id
         WHERE cm.course_id = c.id) AS lesson_count
      FROM courses c
      ORDER BY c.id DESC`
    )
    .all() as AdminCourseRow[];
}

export function createCourse(title: string, description: string, thumbnail: string, workspaceId?: number): number {
  if (workspaceId) {
    const result = db
      .prepare(`INSERT INTO courses (title, description, thumbnail, lessons_count, workspace_id) VALUES (?, ?, ?, 0, ?)`)
      .run(title, description, thumbnail, workspaceId);
    return Number(result.lastInsertRowid);
  }
  const result = db
    .prepare(`INSERT INTO courses (title, description, thumbnail, lessons_count) VALUES (?, ?, ?, 0)`)
    .run(title, description, thumbnail);
  return Number(result.lastInsertRowid);
}

export function updateCourse(
  id: number,
  data: { title?: string; description?: string; thumbnail?: string }
): boolean {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    fields.push("title = ?");
    values.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push("description = ?");
    values.push(data.description);
  }
  if (data.thumbnail !== undefined) {
    fields.push("thumbnail = ?");
    values.push(data.thumbnail);
  }

  if (fields.length === 0) return false;
  values.push(id);

  const result = db
    .prepare(`UPDATE courses SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);
  return result.changes > 0;
}

export function deleteCourse(id: number): boolean {
  const del = db.transaction(() => {
    // Delete lessons belonging to modules of this course (via junction)
    db.prepare(
      `DELETE FROM modules_lessons WHERE module_id IN (SELECT module_id FROM courses_modules WHERE course_id = ?)`
    ).run(id);
    // Delete lessons belonging to modules of this course (direct FK)
    db.prepare(
      `DELETE FROM lessons WHERE module_id IN (SELECT id FROM modules WHERE course_id = ?)`
    ).run(id);
    // Delete junction entries
    db.prepare(`DELETE FROM courses_modules WHERE course_id = ?`).run(id);
    // Delete modules
    db.prepare(`DELETE FROM modules WHERE course_id = ?`).run(id);
    // Delete course
    const result = db.prepare(`DELETE FROM courses WHERE id = ?`).run(id);
    return result.changes > 0;
  });
  return del();
}

// ── Modules ──────────────────────────────────────────────────────────

export interface ModuleRow {
  id: number;
  course_id: number;
  title: string;
  order: number;
}

export function createModule(courseId: number, title: string, order: number): number {
  const create = db.transaction(() => {
    const result = db
      .prepare(`INSERT INTO modules (course_id, title, "order") VALUES (?, ?, ?)`)
      .run(courseId, title, order);
    const newModuleId = Number(result.lastInsertRowid);
    // Also insert into junction table
    db.prepare(`INSERT INTO courses_modules (course_id, module_id, position) VALUES (?, ?, ?)`)
      .run(courseId, newModuleId, order);
    return newModuleId;
  });
  return create();
}

export function updateModule(
  id: number,
  data: { title?: string; order?: number }
): boolean {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    fields.push("title = ?");
    values.push(data.title);
  }
  if (data.order !== undefined) {
    fields.push('"order" = ?');
    values.push(data.order);
  }

  if (fields.length === 0) return false;
  values.push(id);

  const result = db
    .prepare(`UPDATE modules SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);
  return result.changes > 0;
}

export function deleteModule(id: number): boolean {
  const del = db.transaction(() => {
    db.prepare(`DELETE FROM modules_lessons WHERE module_id = ?`).run(id);
    db.prepare(`DELETE FROM lessons WHERE module_id = ?`).run(id);
    db.prepare(`DELETE FROM courses_modules WHERE module_id = ?`).run(id);
    const result = db.prepare(`DELETE FROM modules WHERE id = ?`).run(id);
    return result.changes > 0;
  });
  return del();
}

export function getModulesByCourse(courseId: number): ModuleRow[] {
  return db
    .prepare(
      `SELECT m.id, m.course_id, m.title, m."order"
       FROM modules m
       JOIN courses_modules cm ON cm.module_id = m.id
       WHERE cm.course_id = ?
       ORDER BY cm.position`
    )
    .all(courseId) as ModuleRow[];
}

// ── Lessons ──────────────────────────────────────────────────────────

export interface LessonRow {
  id: number;
  module_id: number;
  title: string;
  content_url: string | null;
  content_type: string | null;
  duration: number | null;
  order: number;
}

export function createLesson(
  moduleId: number,
  title: string,
  contentUrl: string | null,
  contentType: string | null,
  duration: number | null,
  order: number
): number {
  const create = db.transaction(() => {
    const result = db
      .prepare(
        `INSERT INTO lessons (module_id, title, content_url, content_type, duration, "order") VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(moduleId, title, contentUrl, contentType, duration, order);
    const newLessonId = Number(result.lastInsertRowid);
    // Also insert into junction table
    db.prepare(`INSERT INTO modules_lessons (module_id, lesson_id, position) VALUES (?, ?, ?)`)
      .run(moduleId, newLessonId, order);
    return newLessonId;
  });
  return create();
}

export function updateLesson(
  id: number,
  data: {
    title?: string;
    content_url?: string;
    content_type?: string;
    duration?: number;
    order?: number;
  }
): boolean {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    fields.push("title = ?");
    values.push(data.title);
  }
  if (data.content_url !== undefined) {
    fields.push("content_url = ?");
    values.push(data.content_url);
  }
  if (data.content_type !== undefined) {
    fields.push("content_type = ?");
    values.push(data.content_type);
  }
  if (data.duration !== undefined) {
    fields.push("duration = ?");
    values.push(data.duration);
  }
  if (data.order !== undefined) {
    fields.push('"order" = ?');
    values.push(data.order);
  }

  if (fields.length === 0) return false;
  values.push(id);

  const result = db
    .prepare(`UPDATE lessons SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);
  return result.changes > 0;
}

export function deleteLesson(id: number): boolean {
  const del = db.transaction(() => {
    db.prepare(`DELETE FROM modules_lessons WHERE lesson_id = ?`).run(id);
    const result = db.prepare(`DELETE FROM lessons WHERE id = ?`).run(id);
    return result.changes > 0;
  });
  return del();
}

export function getLessonsByModule(moduleId: number): LessonRow[] {
  return db
    .prepare(
      `SELECT l.id, l.module_id, l.title, l.content_url, l.content_type, l.duration, l."order"
       FROM lessons l
       JOIN modules_lessons ml ON ml.lesson_id = l.id
       WHERE ml.module_id = ?
       ORDER BY ml.position`
    )
    .all(moduleId) as LessonRow[];
}

// ── Users ────────────────────────────────────────────────────────────

export interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: number;
  created_at: string;
}

export function listUsers(): AdminUserRow[] {
  return db
    .prepare(
      `SELECT id, name, email, role, is_active, created_at FROM users ORDER BY id`
    )
    .all() as AdminUserRow[];
}

export function updateUser(
  id: number,
  data: { role?: string; is_active?: number }
): boolean {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.role !== undefined) {
    fields.push("role = ?");
    values.push(data.role);
  }
  if (data.is_active !== undefined) {
    fields.push("is_active = ?");
    values.push(data.is_active);
  }

  if (fields.length === 0) return false;
  values.push(id);

  const result = db
    .prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);
  return result.changes > 0;
}

export function softDeleteUser(id: number): boolean {
  const result = db
    .prepare(`UPDATE users SET is_active = 0 WHERE id = ?`)
    .run(id);
  return result.changes > 0;
}
