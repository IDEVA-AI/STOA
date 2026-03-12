import db from "../db/connection";

export function getByWorkspace(workspaceId: number) {
  return db.prepare(`
    SELECT communities.*,
      (SELECT COUNT(*) FROM posts WHERE posts.community_id = communities.id) as post_count
    FROM communities
    WHERE communities.workspace_id = ?
    ORDER BY communities.created_at DESC
  `).all(workspaceId);
}

export function getByCourse(courseId: number) {
  return db.prepare("SELECT * FROM communities WHERE course_id = ?").all(courseId);
}

export function getById(id: number) {
  const community = db.prepare("SELECT * FROM communities WHERE id = ?").get(id);
  if (!community) return null;

  const categories = db.prepare(
    "SELECT * FROM community_categories WHERE community_id = ? ORDER BY position ASC"
  ).all(id);

  return { ...(community as any), categories };
}

export function create(data: {
  workspace_id: number;
  course_id?: number;
  name: string;
  description?: string;
}) {
  const result = db.prepare(
    "INSERT INTO communities (workspace_id, course_id, name, description) VALUES (?, ?, ?, ?)"
  ).run(
    data.workspace_id,
    data.course_id || null,
    data.name,
    data.description || null
  );
  return { id: result.lastInsertRowid };
}

export function update(id: number, data: Partial<{ name: string; description: string }>) {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.description !== undefined) { fields.push("description = ?"); values.push(data.description); }

  if (fields.length === 0) return;

  values.push(id);
  db.prepare(`UPDATE communities SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function remove(id: number) {
  db.prepare("DELETE FROM community_categories WHERE community_id = ?").run(id);
  db.prepare("DELETE FROM communities WHERE id = ?").run(id);
}

export function getCategories(communityId: number) {
  return db.prepare(
    "SELECT * FROM community_categories WHERE community_id = ? ORDER BY position ASC"
  ).all(communityId);
}

export function createCategory(communityId: number, name: string, position: number) {
  const result = db.prepare(
    "INSERT INTO community_categories (community_id, name, position) VALUES (?, ?, ?)"
  ).run(communityId, name, position);
  return { id: result.lastInsertRowid };
}

export function updateCategory(categoryId: number, data: Partial<{ name: string; position: number }>) {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.position !== undefined) { fields.push("position = ?"); values.push(data.position); }

  if (fields.length === 0) return;

  values.push(categoryId);
  db.prepare(`UPDATE community_categories SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function removeCategory(categoryId: number) {
  db.prepare("DELETE FROM community_categories WHERE id = ?").run(categoryId);
}

export function getPosts(
  communityId: number,
  opts: { categoryId?: number; userId?: number; limit?: number; offset?: number } = {}
) {
  const { categoryId, userId, limit = 20, offset = 0 } = opts;
  const userIdForLike = userId || 0;

  let categoryFilter = "";
  const params: any[] = [userIdForLike, communityId];

  if (categoryId) {
    categoryFilter = "AND posts.category_id = ?";
    params.push(categoryId);
  }

  params.push(limit, offset);

  return db.prepare(`
    SELECT posts.*, users.name as user_name, users.avatar as user_avatar,
      CASE WHEN post_likes.id IS NOT NULL THEN 1 ELSE 0 END as has_liked
    FROM posts
    JOIN users ON posts.user_id = users.id
    LEFT JOIN post_likes ON post_likes.post_id = posts.id AND post_likes.user_id = ?
    WHERE posts.community_id = ? ${categoryFilter}
    ORDER BY posts.is_pinned DESC, posts.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params);
}

export function getPinnedPosts(communityId: number) {
  return db.prepare(`
    SELECT posts.*, users.name as user_name, users.avatar as user_avatar
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.community_id = ? AND posts.is_pinned = 1
    ORDER BY posts.created_at DESC
  `).all(communityId);
}
