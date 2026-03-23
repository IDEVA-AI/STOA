import db from "../db/connection";
import { buildSetClause } from "../db/helpers";

export async function getAll() {
  return db.all("SELECT * FROM workspaces");
}

export async function getBySlug(slug: string) {
  return db.get("SELECT * FROM workspaces WHERE slug = $1", [slug]);
}

export async function getById(id: number) {
  return db.get("SELECT * FROM workspaces WHERE id = $1", [id]);
}

export async function getByOwnerId(userId: number) {
  return db.all("SELECT * FROM workspaces WHERE owner_id = $1", [userId]);
}

export async function getByMemberId(userId: number) {
  return db.all(
    `SELECT w.*, wm.role AS member_role
     FROM workspaces w
     JOIN workspace_members wm ON wm.workspace_id = w.id
     WHERE wm.user_id = $1`,
    [userId]
  );
}

export async function create(data: {
  name: string;
  slug: string;
  logo?: string;
  owner_id: number;
  plan?: string;
}) {
  const result = await db.run(
    `INSERT INTO workspaces (name, slug, logo, owner_id, plan)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [data.name, data.slug, data.logo ?? null, data.owner_id, data.plan ?? "free"]
  );
  return result.rows[0].id;
}

export async function update(id: number, data: Partial<{ name: string; slug: string; logo: string; plan: string }>) {
  const { clause, values, nextParam } = buildSetClause(data, 1);

  if (!clause) return;

  await db.run(`UPDATE workspaces SET ${clause} WHERE id = $${nextParam}`, [...values, id]);
}

export async function remove(id: number) {
  await db.run("DELETE FROM workspaces WHERE id = $1", [id]);
}

export async function getMembers(workspaceId: number) {
  return db.all(
    `SELECT wm.id, wm.user_id, u.name, u.email, u.avatar, wm.role, wm.joined_at
     FROM workspace_members wm
     JOIN users u ON u.id = wm.user_id
     WHERE wm.workspace_id = $1`,
    [workspaceId]
  );
}

export async function addMember(workspaceId: number, userId: number, role: string) {
  await db.run(
    `INSERT INTO workspace_members (workspace_id, user_id, role)
     VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
    [workspaceId, userId, role]
  );
}

export async function updateMemberRole(workspaceId: number, userId: number, role: string) {
  await db.run(
    `UPDATE workspace_members SET role = $1 WHERE workspace_id = $2 AND user_id = $3`,
    [role, workspaceId, userId]
  );
}

export async function removeMember(workspaceId: number, userId: number) {
  await db.run(
    `DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
    [workspaceId, userId]
  );
}

export async function isMember(workspaceId: number, userId: number): Promise<string | null> {
  const row = await db.get<{ role: string }>(
    "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
    [workspaceId, userId]
  );
  return row ? row.role : null;
}
