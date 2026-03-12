import db from "../db/connection";

export function getAll() {
  return db.prepare("SELECT * FROM workspaces").all();
}

export function getBySlug(slug: string) {
  return db.prepare("SELECT * FROM workspaces WHERE slug = ?").get(slug);
}

export function getById(id: number) {
  return db.prepare("SELECT * FROM workspaces WHERE id = ?").get(id);
}

export function getByOwnerId(userId: number) {
  return db.prepare("SELECT * FROM workspaces WHERE owner_id = ?").all(userId);
}

export function getByMemberId(userId: number) {
  return db
    .prepare(
      `SELECT w.*, wm.role AS member_role
       FROM workspaces w
       JOIN workspace_members wm ON wm.workspace_id = w.id
       WHERE wm.user_id = ?`
    )
    .all(userId);
}

export function create(data: {
  name: string;
  slug: string;
  logo?: string;
  owner_id: number;
  plan?: string;
}) {
  const result = db
    .prepare(
      `INSERT INTO workspaces (name, slug, logo, owner_id, plan)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(data.name, data.slug, data.logo ?? null, data.owner_id, data.plan ?? "free");
  return result.lastInsertRowid;
}

export function update(id: number, data: Partial<{ name: string; slug: string; logo: string; plan: string }>) {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.slug !== undefined) {
    fields.push("slug = ?");
    values.push(data.slug);
  }
  if (data.logo !== undefined) {
    fields.push("logo = ?");
    values.push(data.logo);
  }
  if (data.plan !== undefined) {
    fields.push("plan = ?");
    values.push(data.plan);
  }

  if (fields.length === 0) return;

  values.push(id);
  db.prepare(`UPDATE workspaces SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function remove(id: number) {
  db.prepare("DELETE FROM workspaces WHERE id = ?").run(id);
}

export function getMembers(workspaceId: number) {
  return db
    .prepare(
      `SELECT wm.id, wm.user_id, u.name, u.email, u.avatar, wm.role, wm.joined_at
       FROM workspace_members wm
       JOIN users u ON u.id = wm.user_id
       WHERE wm.workspace_id = ?`
    )
    .all(workspaceId);
}

export function addMember(workspaceId: number, userId: number, role: string) {
  db.prepare(
    `INSERT OR IGNORE INTO workspace_members (workspace_id, user_id, role)
     VALUES (?, ?, ?)`
  ).run(workspaceId, userId, role);
}

export function updateMemberRole(workspaceId: number, userId: number, role: string) {
  db.prepare(
    `UPDATE workspace_members SET role = ? WHERE workspace_id = ? AND user_id = ?`
  ).run(role, workspaceId, userId);
}

export function removeMember(workspaceId: number, userId: number) {
  db.prepare(
    `DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?`
  ).run(workspaceId, userId);
}

export function isMember(workspaceId: number, userId: number): string | null {
  const row = db
    .prepare("SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?")
    .get(workspaceId, userId) as { role: string } | undefined;
  return row ? row.role : null;
}
