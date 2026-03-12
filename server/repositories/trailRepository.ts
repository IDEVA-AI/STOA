import db from "../db/connection";

export function getByWorkspace(workspaceId: number) {
  return db.prepare(`
    SELECT trails.*, COUNT(trails_courses.id) as course_count
    FROM trails
    LEFT JOIN trails_courses ON trails_courses.trail_id = trails.id
    WHERE trails.workspace_id = ?
    GROUP BY trails.id
    ORDER BY trails.created_at DESC
  `).all(workspaceId);
}

export function getById(id: number) {
  return db.prepare("SELECT * FROM trails WHERE id = ?").get(id);
}

export function getWithCourses(id: number) {
  const trail = db.prepare("SELECT * FROM trails WHERE id = ?").get(id);
  if (!trail) return null;

  const courses = db.prepare(`
    SELECT courses.*, trails_courses.position
    FROM trails_courses
    JOIN courses ON courses.id = trails_courses.course_id
    WHERE trails_courses.trail_id = ?
    ORDER BY trails_courses.position ASC
  `).all(id);

  return { ...(trail as any), courses };
}

export function create(data: {
  workspace_id: number;
  title: string;
  description?: string;
  thumbnail?: string;
  is_published?: number;
}) {
  const result = db.prepare(
    "INSERT INTO trails (workspace_id, title, description, thumbnail, is_published) VALUES (?, ?, ?, ?, ?)"
  ).run(
    data.workspace_id,
    data.title,
    data.description || null,
    data.thumbnail || null,
    data.is_published ?? 0
  );
  return { id: result.lastInsertRowid };
}

export function update(id: number, data: Partial<{ title: string; description: string; thumbnail: string; is_published: number }>) {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) { fields.push("title = ?"); values.push(data.title); }
  if (data.description !== undefined) { fields.push("description = ?"); values.push(data.description); }
  if (data.thumbnail !== undefined) { fields.push("thumbnail = ?"); values.push(data.thumbnail); }
  if (data.is_published !== undefined) { fields.push("is_published = ?"); values.push(data.is_published); }

  if (fields.length === 0) return;

  values.push(id);
  db.prepare(`UPDATE trails SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function remove(id: number) {
  db.prepare("DELETE FROM trails_courses WHERE trail_id = ?").run(id);
  db.prepare("DELETE FROM trails WHERE id = ?").run(id);
}

export function setCourses(trailId: number, courseIds: number[]) {
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM trails_courses WHERE trail_id = ?").run(trailId);
    const insert = db.prepare(
      "INSERT INTO trails_courses (trail_id, course_id, position) VALUES (?, ?, ?)"
    );
    courseIds.forEach((courseId, index) => {
      insert.run(trailId, courseId, index);
    });
  });
  tx();
}

export function addCourse(trailId: number, courseId: number, position: number) {
  db.prepare(
    "INSERT INTO trails_courses (trail_id, course_id, position) VALUES (?, ?, ?)"
  ).run(trailId, courseId, position);
}

export function removeCourse(trailId: number, courseId: number) {
  db.prepare(
    "DELETE FROM trails_courses WHERE trail_id = ? AND course_id = ?"
  ).run(trailId, courseId);
}

export function reorderCourses(trailId: number, courseIds: number[]) {
  const tx = db.transaction(() => {
    const update = db.prepare(
      "UPDATE trails_courses SET position = ? WHERE trail_id = ? AND course_id = ?"
    );
    courseIds.forEach((courseId, index) => {
      update.run(index, trailId, courseId);
    });
  });
  tx();
}
