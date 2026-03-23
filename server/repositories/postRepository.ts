import db from "../db/connection";

export async function getAllPosts(userId: number = 1) {
  return await db.all(`
    SELECT posts.*, users.name as user_name, users.avatar as user_avatar,
      CASE WHEN post_likes.id IS NOT NULL THEN 1 ELSE 0 END as has_liked
    FROM posts
    JOIN users ON posts.user_id = users.id
    LEFT JOIN post_likes ON post_likes.post_id = posts.id AND post_likes.user_id = $1
    ORDER BY created_at DESC
  `, [userId]);
}

export async function createPost(userId: number, content: string) {
  return await db.run("INSERT INTO posts (user_id, content) VALUES ($1, $2)", [userId, content]);
}

export async function getComments(postId: number) {
  return await db.all(`
    SELECT post_comments.*, users.name as user_name, users.avatar as user_avatar
    FROM post_comments
    JOIN users ON post_comments.user_id = users.id
    WHERE post_comments.post_id = $1
    ORDER BY post_comments.created_at ASC
  `, [postId]);
}

export async function createComment(postId: number, userId: number, content: string) {
  const result = await db.run(
    "INSERT INTO post_comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING id",
    [postId, userId, content]
  );

  return await db.get(`
    SELECT post_comments.*, users.name as user_name, users.avatar as user_avatar
    FROM post_comments
    JOIN users ON post_comments.user_id = users.id
    WHERE post_comments.id = $1
  `, [result.rows[0].id]);
}

export async function toggleLike(postId: number, userId: number): Promise<boolean> {
  const existing = await db.get(
    "SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2",
    [postId, userId]
  );

  if (existing) {
    await db.run("DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2", [postId, userId]);
    await db.run("UPDATE posts SET likes = likes - 1 WHERE id = $1", [postId]);
    return false;
  } else {
    await db.run("INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)", [postId, userId]);
    await db.run("UPDATE posts SET likes = likes + 1 WHERE id = $1", [postId]);
    return true;
  }
}

export async function getCommentCount(postId: number) {
  const row = await db.get<{ count: number }>(
    "SELECT COUNT(*) as count FROM post_comments WHERE post_id = $1",
    [postId]
  );
  return row!.count;
}

export async function getTopPosters(limit: number = 5) {
  return await db.all(`
    SELECT users.id, users.name, users.avatar, COUNT(posts.id) as post_count
    FROM users
    JOIN posts ON posts.user_id = users.id
    GROUP BY users.id
    ORDER BY post_count DESC
    LIMIT $1
  `, [limit]);
}

export async function getTrendingPosts(limit: number = 5) {
  return await db.all(`
    SELECT posts.id, posts.content, posts.likes, users.name as user_name
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.created_at >= NOW() - INTERVAL '7 days'
    ORDER BY posts.likes DESC
    LIMIT $1
  `, [limit]);
}
