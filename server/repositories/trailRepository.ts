import db from "../db/connection";

export async function getByWorkspace(workspaceId: number) {
  return db.all(`
    SELECT trails.*, COUNT(trails_courses.id) as course_count
    FROM trails
    LEFT JOIN trails_courses ON trails_courses.trail_id = trails.id
    WHERE trails.workspace_id = $1
    GROUP BY trails.id
    ORDER BY trails.created_at DESC
  `, [workspaceId]);
}

export async function getById(id: number) {
  return db.get("SELECT * FROM trails WHERE id = $1", [id]);
}

export async function getWithCourses(id: number) {
  const trail = await db.get("SELECT * FROM trails WHERE id = $1", [id]);
  if (!trail) return null;

  const courses = await db.all(`
    SELECT courses.*, trails_courses.position
    FROM trails_courses
    JOIN courses ON courses.id = trails_courses.course_id
    WHERE trails_courses.trail_id = $1
    ORDER BY trails_courses.position ASC
  `, [id]);

  return { ...(trail as any), courses };
}

export async function create(data: {
  workspace_id: number;
  title: string;
  description?: string;
  thumbnail?: string;
  is_published?: number;
}): Promise<{ id: number }> {
  const result = await db.run(
    "INSERT INTO trails (workspace_id, title, description, thumbnail, is_published) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [
      data.workspace_id,
      data.title,
      data.description || null,
      data.thumbnail || null,
      data.is_published ?? 0,
    ]
  );
  return { id: result.rows[0].id };
}

export async function update(id: number, data: Partial<{ title: string; description: string; thumbnail: string; is_published: number }>): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) { fields.push(`title = $${paramIndex}`); values.push(data.title); paramIndex++; }
  if (data.description !== undefined) { fields.push(`description = $${paramIndex}`); values.push(data.description); paramIndex++; }
  if (data.thumbnail !== undefined) { fields.push(`thumbnail = $${paramIndex}`); values.push(data.thumbnail); paramIndex++; }
  if (data.is_published !== undefined) { fields.push(`is_published = $${paramIndex}`); values.push(data.is_published); paramIndex++; }

  if (fields.length === 0) return;

  values.push(id);
  await db.run(`UPDATE trails SET ${fields.join(", ")} WHERE id = $${paramIndex}`, values);
}

export async function remove(id: number): Promise<void> {
  await db.run("DELETE FROM trails_courses WHERE trail_id = $1", [id]);
  await db.run("DELETE FROM trails WHERE id = $1", [id]);
}

export async function setCourses(trailId: number, courseIds: number[]): Promise<void> {
  await db.transaction(async (client) => {
    await client.query("DELETE FROM trails_courses WHERE trail_id = $1", [trailId]);
    for (let index = 0; index < courseIds.length; index++) {
      await client.query(
        "INSERT INTO trails_courses (trail_id, course_id, position) VALUES ($1, $2, $3)",
        [trailId, courseIds[index], index]
      );
    }
  });
}

export async function addCourse(trailId: number, courseId: number, position: number): Promise<void> {
  await db.run(
    "INSERT INTO trails_courses (trail_id, course_id, position) VALUES ($1, $2, $3)",
    [trailId, courseId, position]
  );
}

export async function removeCourse(trailId: number, courseId: number): Promise<void> {
  await db.run(
    "DELETE FROM trails_courses WHERE trail_id = $1 AND course_id = $2",
    [trailId, courseId]
  );
}

export async function reorderCourses(trailId: number, courseIds: number[]): Promise<void> {
  await db.transaction(async (client) => {
    for (let index = 0; index < courseIds.length; index++) {
      await client.query(
        "UPDATE trails_courses SET position = $1 WHERE trail_id = $2 AND course_id = $3",
        [index, trailId, courseIds[index]]
      );
    }
  });
}
