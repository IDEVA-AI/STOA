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

export async function listCourses(): Promise<AdminCourseRow[]> {
  return db.all<AdminCourseRow>(
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
  );
}

export async function createCourse(title: string, description: string, thumbnail: string, workspaceId?: number): Promise<number> {
  if (workspaceId) {
    const result = await db.run(
      `INSERT INTO courses (title, description, thumbnail, lessons_count, workspace_id) VALUES ($1, $2, $3, 0, $4) RETURNING id`,
      [title, description, thumbnail, workspaceId]
    );
    return result.rows[0].id;
  }
  const result = await db.run(
    `INSERT INTO courses (title, description, thumbnail, lessons_count) VALUES ($1, $2, $3, 0) RETURNING id`,
    [title, description, thumbnail]
  );
  return result.rows[0].id;
}

export async function updateCourse(
  id: number,
  data: { title?: string; description?: string; thumbnail?: string }
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }
  if (data.thumbnail !== undefined) {
    fields.push(`thumbnail = $${paramIndex++}`);
    values.push(data.thumbnail);
  }

  if (fields.length === 0) return false;
  values.push(id);

  const result = await db.run(
    `UPDATE courses SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
    values
  );
  return result.rowCount > 0;
}

export async function deleteCourse(id: number): Promise<boolean> {
  return db.transaction(async (client) => {
    // Delete lessons belonging to modules of this course (via junction)
    await client.query(
      `DELETE FROM modules_lessons WHERE module_id IN (SELECT module_id FROM courses_modules WHERE course_id = $1)`,
      [id]
    );
    // Delete lessons belonging to modules of this course (direct FK)
    await client.query(
      `DELETE FROM lessons WHERE module_id IN (SELECT id FROM modules WHERE course_id = $1)`,
      [id]
    );
    // Delete junction entries
    await client.query(`DELETE FROM courses_modules WHERE course_id = $1`, [id]);
    // Delete modules
    await client.query(`DELETE FROM modules WHERE course_id = $1`, [id]);
    // Delete course
    const result = await client.query(`DELETE FROM courses WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  });
}

// ── Modules ──────────────────────────────────────────────────────────

export interface ModuleRow {
  id: number;
  course_id: number;
  title: string;
  order: number;
}

export async function createModule(courseId: number, title: string, order: number): Promise<number> {
  return db.transaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO modules (course_id, title, "order") VALUES ($1, $2, $3) RETURNING id`,
      [courseId, title, order]
    );
    const newModuleId = rows[0].id;
    // Also insert into junction table
    await client.query(
      `INSERT INTO courses_modules (course_id, module_id, position) VALUES ($1, $2, $3)`,
      [courseId, newModuleId, order]
    );
    return newModuleId;
  });
}

export async function updateModule(
  id: number,
  data: { title?: string; order?: number }
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(data.title);
  }
  if (data.order !== undefined) {
    fields.push(`"order" = $${paramIndex++}`);
    values.push(data.order);
  }

  if (fields.length === 0) return false;
  values.push(id);

  const result = await db.run(
    `UPDATE modules SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
    values
  );
  return result.rowCount > 0;
}

export async function deleteModule(id: number): Promise<boolean> {
  return db.transaction(async (client) => {
    await client.query(`DELETE FROM modules_lessons WHERE module_id = $1`, [id]);
    await client.query(`DELETE FROM lessons WHERE module_id = $1`, [id]);
    await client.query(`DELETE FROM courses_modules WHERE module_id = $1`, [id]);
    const result = await client.query(`DELETE FROM modules WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  });
}

export async function getModulesByCourse(courseId: number): Promise<ModuleRow[]> {
  return db.all<ModuleRow>(
    `SELECT m.id, m.course_id, m.title, m."order"
     FROM modules m
     JOIN courses_modules cm ON cm.module_id = m.id
     WHERE cm.course_id = $1
     ORDER BY cm.position`,
    [courseId]
  );
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

export async function createLesson(
  moduleId: number,
  title: string,
  contentUrl: string | null,
  contentType: string | null,
  duration: number | null,
  order: number
): Promise<number> {
  return db.transaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO lessons (module_id, title, content_url, content_type, duration, "order") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [moduleId, title, contentUrl, contentType, duration, order]
    );
    const newLessonId = rows[0].id;
    // Also insert into junction table
    await client.query(
      `INSERT INTO modules_lessons (module_id, lesson_id, position) VALUES ($1, $2, $3)`,
      [moduleId, newLessonId, order]
    );
    return newLessonId;
  });
}

export async function updateLesson(
  id: number,
  data: {
    title?: string;
    content_url?: string;
    content_type?: string;
    duration?: number;
    order?: number;
  }
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(data.title);
  }
  if (data.content_url !== undefined) {
    fields.push(`content_url = $${paramIndex++}`);
    values.push(data.content_url);
  }
  if (data.content_type !== undefined) {
    fields.push(`content_type = $${paramIndex++}`);
    values.push(data.content_type);
  }
  if (data.duration !== undefined) {
    fields.push(`duration = $${paramIndex++}`);
    values.push(data.duration);
  }
  if (data.order !== undefined) {
    fields.push(`"order" = $${paramIndex++}`);
    values.push(data.order);
  }

  if (fields.length === 0) return false;
  values.push(id);

  const result = await db.run(
    `UPDATE lessons SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
    values
  );
  return result.rowCount > 0;
}

export async function deleteLesson(id: number): Promise<boolean> {
  return db.transaction(async (client) => {
    await client.query(`DELETE FROM modules_lessons WHERE lesson_id = $1`, [id]);
    const result = await client.query(`DELETE FROM lessons WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  });
}

export async function getLessonsByModule(moduleId: number): Promise<LessonRow[]> {
  return db.all<LessonRow>(
    `SELECT l.id, l.module_id, l.title, l.content_url, l.content_type, l.duration, l."order"
     FROM lessons l
     JOIN modules_lessons ml ON ml.lesson_id = l.id
     WHERE ml.module_id = $1
     ORDER BY ml.position`,
    [moduleId]
  );
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

export async function listUsers(): Promise<AdminUserRow[]> {
  return db.all<AdminUserRow>(
    `SELECT id, name, email, role, is_active, created_at FROM users ORDER BY id`
  );
}

export async function updateUser(
  id: number,
  data: { role?: string; is_active?: number }
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.role !== undefined) {
    fields.push(`role = $${paramIndex++}`);
    values.push(data.role);
  }
  if (data.is_active !== undefined) {
    fields.push(`is_active = $${paramIndex++}`);
    values.push(data.is_active);
  }

  if (fields.length === 0) return false;
  values.push(id);

  const result = await db.run(
    `UPDATE users SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
    values
  );
  return result.rowCount > 0;
}

export async function softDeleteUser(id: number): Promise<boolean> {
  const result = await db.run(
    `UPDATE users SET is_active = 0 WHERE id = $1`,
    [id]
  );
  return result.rowCount > 0;
}
