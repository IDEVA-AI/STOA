import db from "../db/connection";

export function getByUser(userId: number) {
  return db
    .prepare(
      `SELECT pu.*, p.title AS product_title, p.type AS product_type, p.price AS product_price
       FROM purchases pu
       JOIN products p ON p.id = pu.product_id
       WHERE pu.user_id = ? AND pu.status = 'active'
       ORDER BY pu.purchased_at DESC`
    )
    .all(userId);
}

export function getByWorkspace(workspaceId: number) {
  return db
    .prepare(
      `SELECT pu.*, p.title AS product_title, p.type AS product_type, p.price AS product_price,
              u.name AS user_name, u.email AS user_email
       FROM purchases pu
       JOIN products p ON p.id = pu.product_id
       JOIN users u ON u.id = pu.user_id
       WHERE pu.workspace_id = ?
       ORDER BY pu.purchased_at DESC`
    )
    .all(workspaceId);
}

export function getById(id: number) {
  return db
    .prepare(
      `SELECT pu.*, p.title AS product_title, p.type AS product_type, p.price AS product_price
       FROM purchases pu
       JOIN products p ON p.id = pu.product_id
       WHERE pu.id = ?`
    )
    .get(id);
}

export function create(data: {
  user_id: number;
  product_id: number;
  workspace_id: number;
  status?: string;
  expires_at?: string | null;
}) {
  const result = db
    .prepare(
      `INSERT INTO purchases (user_id, product_id, workspace_id, status, expires_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      data.user_id,
      data.product_id,
      data.workspace_id,
      data.status ?? "active",
      data.expires_at ?? null
    );
  return result.lastInsertRowid as number;
}

export function updateStatus(id: number, status: string) {
  db.prepare("UPDATE purchases SET status = ? WHERE id = ?").run(status, id);
}

export function hasAccess(userId: number, courseId: number): boolean {
  const row = db
    .prepare(
      `SELECT 1 FROM purchases pu
       JOIN product_courses pc ON pc.product_id = pu.product_id
       WHERE pu.user_id = ?
         AND pc.course_id = ?
         AND pu.status = 'active'
         AND (pu.expires_at IS NULL OR pu.expires_at > datetime('now'))
       LIMIT 1`
    )
    .get(userId, courseId);
  return !!row;
}

export function getUserCourseIds(userId: number): number[] {
  const rows = db
    .prepare(
      `SELECT DISTINCT pc.course_id FROM purchases pu
       JOIN product_courses pc ON pc.product_id = pu.product_id
       WHERE pu.user_id = ?
         AND pu.status = 'active'
         AND (pu.expires_at IS NULL OR pu.expires_at > datetime('now'))`
    )
    .all(userId) as { course_id: number }[];
  return rows.map((r) => r.course_id);
}

export function getByUserAndWorkspace(userId: number, workspaceId: number) {
  return db
    .prepare(
      `SELECT pu.*, p.title AS product_title, p.type AS product_type, p.price AS product_price
       FROM purchases pu
       JOIN products p ON p.id = pu.product_id
       WHERE pu.user_id = ? AND pu.workspace_id = ? AND pu.status = 'active'
       ORDER BY pu.purchased_at DESC`
    )
    .all(userId, workspaceId);
}
