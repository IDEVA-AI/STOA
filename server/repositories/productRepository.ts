import db from "../db/connection";

export async function getByWorkspace(workspaceId: number) {
  return db.all(
    `SELECT p.*,
            (SELECT COUNT(*) FROM product_courses pc WHERE pc.product_id = p.id) AS course_count
     FROM products p
     WHERE p.workspace_id = $1
     ORDER BY p.created_at DESC`,
    [workspaceId]
  );
}

export async function getById(id: number) {
  return db.get("SELECT * FROM products WHERE id = $1", [id]);
}

export async function create(data: {
  workspace_id: number;
  title: string;
  description?: string;
  price?: number;
  type?: string;
  is_published?: number;
}): Promise<number> {
  const result = await db.run(
    `INSERT INTO products (workspace_id, title, description, price, type, is_published)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      data.workspace_id,
      data.title,
      data.description ?? null,
      data.price ?? 0,
      data.type ?? "course",
      data.is_published ?? 0,
    ]
  );
  return result.rows[0].id as number;
}

export async function update(id: number, data: Partial<{
  title: string;
  description: string;
  price: number;
  type: string;
  is_published: number;
}>): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) return;

  values.push(id);
  await db.run(`UPDATE products SET ${fields.join(", ")} WHERE id = $${paramIndex}`, values);
}

export async function remove(id: number): Promise<void> {
  await db.run("DELETE FROM product_courses WHERE product_id = $1", [id]);
  await db.run("DELETE FROM products WHERE id = $1", [id]);
}

export async function getCourses(productId: number) {
  return db.all(
    `SELECT c.* FROM courses c
     JOIN product_courses pc ON pc.course_id = c.id
     WHERE pc.product_id = $1`,
    [productId]
  );
}

export async function linkCourse(productId: number, courseId: number): Promise<void> {
  await db.run(
    "INSERT INTO product_courses (product_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [productId, courseId]
  );
}

export async function unlinkCourse(productId: number, courseId: number): Promise<void> {
  await db.run(
    "DELETE FROM product_courses WHERE product_id = $1 AND course_id = $2",
    [productId, courseId]
  );
}

export async function setCourses(productId: number, courseIds: number[]): Promise<void> {
  await db.transaction(async (client) => {
    await client.query("DELETE FROM product_courses WHERE product_id = $1", [productId]);
    for (const courseId of courseIds) {
      await client.query(
        "INSERT INTO product_courses (product_id, course_id) VALUES ($1, $2)",
        [productId, courseId]
      );
    }
  });
}
