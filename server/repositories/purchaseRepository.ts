import db from "../db/connection";

export async function getByUser(userId: number) {
  return await db.all(
    `SELECT pu.*, p.title AS product_title, p.type AS product_type, p.price AS product_price
     FROM purchases pu
     JOIN products p ON p.id = pu.product_id
     WHERE pu.user_id = $1 AND pu.status = 'active'
     ORDER BY pu.purchased_at DESC`,
    [userId]
  );
}

export async function getByWorkspace(workspaceId: number) {
  return await db.all(
    `SELECT pu.*, p.title AS product_title, p.type AS product_type, p.price AS product_price,
            u.name AS user_name, u.email AS user_email
     FROM purchases pu
     JOIN products p ON p.id = pu.product_id
     JOIN users u ON u.id = pu.user_id
     WHERE pu.workspace_id = $1
     ORDER BY pu.purchased_at DESC`,
    [workspaceId]
  );
}

export async function getById(id: number) {
  return await db.get(
    `SELECT pu.*, p.title AS product_title, p.type AS product_type, p.price AS product_price
     FROM purchases pu
     JOIN products p ON p.id = pu.product_id
     WHERE pu.id = $1`,
    [id]
  );
}

export async function create(data: {
  user_id: number;
  product_id: number;
  workspace_id: number;
  status?: string;
  expires_at?: string | null;
}) {
  const result = await db.run(
    `INSERT INTO purchases (user_id, product_id, workspace_id, status, expires_at)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [
      data.user_id,
      data.product_id,
      data.workspace_id,
      data.status ?? "active",
      data.expires_at ?? null
    ]
  );
  return result.rows[0].id as number;
}

export async function updateStatus(id: number, status: string) {
  await db.run("UPDATE purchases SET status = $1 WHERE id = $2", [status, id]);
}

export async function hasAccess(userId: number, courseId: number): Promise<boolean> {
  const row = await db.get(
    `SELECT 1 FROM purchases pu
     JOIN product_courses pc ON pc.product_id = pu.product_id
     WHERE pu.user_id = $1
       AND pc.course_id = $2
       AND pu.status = 'active'
       AND (pu.expires_at IS NULL OR pu.expires_at > NOW())
     LIMIT 1`,
    [userId, courseId]
  );
  return !!row;
}

export async function getUserCourseIds(userId: number): Promise<number[]> {
  const rows = await db.all<{ course_id: number }>(
    `SELECT DISTINCT pc.course_id FROM purchases pu
     JOIN product_courses pc ON pc.product_id = pu.product_id
     WHERE pu.user_id = $1
       AND pu.status = 'active'
       AND (pu.expires_at IS NULL OR pu.expires_at > NOW())`,
    [userId]
  );
  return rows.map((r) => r.course_id);
}

export async function getByUserAndWorkspace(userId: number, workspaceId: number) {
  return await db.all(
    `SELECT pu.*, p.title AS product_title, p.type AS product_type, p.price AS product_price
     FROM purchases pu
     JOIN products p ON p.id = pu.product_id
     WHERE pu.user_id = $1 AND pu.workspace_id = $2 AND pu.status = 'active'
     ORDER BY pu.purchased_at DESC`,
    [userId, workspaceId]
  );
}
