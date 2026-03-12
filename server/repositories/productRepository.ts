import db from "../db/connection";

export function getByWorkspace(workspaceId: number) {
  return db
    .prepare(
      `SELECT p.*,
              (SELECT COUNT(*) FROM product_courses pc WHERE pc.product_id = p.id) AS course_count
       FROM products p
       WHERE p.workspace_id = ?
       ORDER BY p.created_at DESC`
    )
    .all(workspaceId);
}

export function getById(id: number) {
  return db.prepare("SELECT * FROM products WHERE id = ?").get(id);
}

export function create(data: {
  workspace_id: number;
  title: string;
  description?: string;
  price?: number;
  type?: string;
  is_published?: number;
}) {
  const result = db
    .prepare(
      `INSERT INTO products (workspace_id, title, description, price, type, is_published)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.workspace_id,
      data.title,
      data.description ?? null,
      data.price ?? 0,
      data.type ?? "course",
      data.is_published ?? 0
    );
  return result.lastInsertRowid as number;
}

export function update(id: number, data: Partial<{
  title: string;
  description: string;
  price: number;
  type: string;
  is_published: number;
}>) {
  const fields: string[] = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return;

  values.push(id);
  db.prepare(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function remove(id: number) {
  db.prepare("DELETE FROM product_courses WHERE product_id = ?").run(id);
  db.prepare("DELETE FROM products WHERE id = ?").run(id);
}

export function getCourses(productId: number) {
  return db
    .prepare(
      `SELECT c.* FROM courses c
       JOIN product_courses pc ON pc.course_id = c.id
       WHERE pc.product_id = ?`
    )
    .all(productId);
}

export function linkCourse(productId: number, courseId: number) {
  db.prepare(
    "INSERT OR IGNORE INTO product_courses (product_id, course_id) VALUES (?, ?)"
  ).run(productId, courseId);
}

export function unlinkCourse(productId: number, courseId: number) {
  db.prepare(
    "DELETE FROM product_courses WHERE product_id = ? AND course_id = ?"
  ).run(productId, courseId);
}

export function setCourses(productId: number, courseIds: number[]) {
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM product_courses WHERE product_id = ?").run(productId);
    const insert = db.prepare(
      "INSERT INTO product_courses (product_id, course_id) VALUES (?, ?)"
    );
    for (const courseId of courseIds) {
      insert.run(productId, courseId);
    }
  });
  tx();
}
