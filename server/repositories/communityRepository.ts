import db from "../db/connection";

export async function getByWorkspace(workspaceId: number) {
  return await db.all(`
    SELECT communities.*,
      (SELECT COUNT(*) FROM posts WHERE posts.community_id = communities.id) as post_count
    FROM communities
    WHERE communities.workspace_id = $1
    ORDER BY communities.created_at DESC
  `, [workspaceId]);
}

export async function getByCourse(courseId: number) {
  return await db.all("SELECT * FROM communities WHERE course_id = $1", [courseId]);
}

export async function getById(id: number) {
  const community = await db.get("SELECT * FROM communities WHERE id = $1", [id]);
  if (!community) return null;

  const categories = await db.all(
    "SELECT * FROM community_categories WHERE community_id = $1 ORDER BY position ASC",
    [id]
  );

  return { ...(community as any), categories };
}

export async function create(data: {
  workspace_id: number;
  course_id?: number;
  name: string;
  description?: string;
}) {
  const result = await db.run(
    "INSERT INTO communities (workspace_id, course_id, name, description) VALUES ($1, $2, $3, $4) RETURNING id",
    [
      data.workspace_id,
      data.course_id || null,
      data.name,
      data.description || null
    ]
  );
  return { id: result.rows[0].id };
}

export async function update(id: number, data: Partial<{ name: string; description: string }>) {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(data.name); }
  if (data.description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(data.description); }

  if (fields.length === 0) return;

  values.push(id);
  await db.run(`UPDATE communities SET ${fields.join(", ")} WHERE id = $${paramIndex}`, values);
}

export async function remove(id: number) {
  await db.run("DELETE FROM community_categories WHERE community_id = $1", [id]);
  await db.run("DELETE FROM communities WHERE id = $1", [id]);
}

export async function getCategories(communityId: number) {
  return await db.all(
    "SELECT * FROM community_categories WHERE community_id = $1 ORDER BY position ASC",
    [communityId]
  );
}

export async function createCategory(communityId: number, name: string, position: number) {
  const result = await db.run(
    "INSERT INTO community_categories (community_id, name, position) VALUES ($1, $2, $3) RETURNING id",
    [communityId, name, position]
  );
  return { id: result.rows[0].id };
}

export async function updateCategory(categoryId: number, data: Partial<{ name: string; position: number }>) {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(data.name); }
  if (data.position !== undefined) { fields.push(`position = $${paramIndex++}`); values.push(data.position); }

  if (fields.length === 0) return;

  values.push(categoryId);
  await db.run(`UPDATE community_categories SET ${fields.join(", ")} WHERE id = $${paramIndex}`, values);
}

export async function removeCategory(categoryId: number) {
  await db.run("DELETE FROM community_categories WHERE id = $1", [categoryId]);
}

export async function getPosts(
  communityId: number,
  opts: { categoryId?: number; userId?: number; limit?: number; offset?: number } = {}
) {
  const { categoryId, userId, limit = 20, offset = 0 } = opts;
  const userIdForLike = userId || 0;

  let paramIndex = 1;
  const params: any[] = [];

  params.push(userIdForLike);
  const userIdParam = `$${paramIndex++}`;

  params.push(communityId);
  const communityIdParam = `$${paramIndex++}`;

  let categoryFilter = "";
  if (categoryId) {
    params.push(categoryId);
    categoryFilter = `AND posts.category_id = $${paramIndex++}`;
  }

  params.push(limit);
  const limitParam = `$${paramIndex++}`;

  params.push(offset);
  const offsetParam = `$${paramIndex++}`;

  return await db.all(`
    SELECT posts.*, users.name as user_name, users.avatar as user_avatar,
      posts.is_pinned as pinned,
      CASE WHEN post_likes.id IS NOT NULL THEN 1 ELSE 0 END as has_liked,
      (SELECT COUNT(*) FROM post_comments WHERE post_comments.post_id = posts.id) as comment_count
    FROM posts
    JOIN users ON posts.user_id = users.id
    LEFT JOIN post_likes ON post_likes.post_id = posts.id AND post_likes.user_id = ${userIdParam}
    WHERE posts.community_id = ${communityIdParam} ${categoryFilter}
    ORDER BY posts.is_pinned DESC, posts.created_at DESC
    LIMIT ${limitParam} OFFSET ${offsetParam}
  `, params);
}

export async function createPost(communityId: number, userId: number, content: string, categoryId?: number) {
  const result = await db.run(
    "INSERT INTO posts (community_id, user_id, content, category_id) VALUES ($1, $2, $3, $4) RETURNING id",
    [communityId, userId, content, categoryId || null]
  );
  const id = result.rows[0].id;
  return await db.get(`
    SELECT posts.*, users.name as user_name, users.avatar as user_avatar,
      posts.is_pinned as pinned,
      0 as has_liked,
      0 as comment_count
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.id = $1
  `, [id]);
}

export async function getPostById(postId: number) {
  return await db.get("SELECT * FROM posts WHERE id = $1", [postId]) as any;
}

export async function togglePin(postId: number) {
  await db.run("UPDATE posts SET is_pinned = CASE WHEN is_pinned = 1 THEN 0 ELSE 1 END WHERE id = $1", [postId]);
  const post = await db.get("SELECT is_pinned FROM posts WHERE id = $1", [postId]) as any;
  return { pinned: post?.is_pinned === 1 };
}

export async function deletePost(postId: number) {
  await db.run("DELETE FROM post_likes WHERE post_id = $1", [postId]);
  await db.run("DELETE FROM post_comments WHERE post_id = $1", [postId]);
  await db.run("DELETE FROM posts WHERE id = $1", [postId]);
}

export async function updatePost(postId: number, content: string) {
  await db.run("UPDATE posts SET content = $1 WHERE id = $2", [content, postId]);
}

export async function getPinnedPosts(communityId: number) {
  return await db.all(`
    SELECT posts.*, users.name as user_name, users.avatar as user_avatar,
      posts.is_pinned as pinned
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.community_id = $1 AND posts.is_pinned = 1
    ORDER BY posts.created_at DESC
  `, [communityId]);
}
