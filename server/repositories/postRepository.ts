import db from "../db/connection";

export function getAllPosts(userId: number = 1) {
  return db.prepare(`
    SELECT posts.*, users.name as user_name, users.avatar as user_avatar,
      CASE WHEN post_likes.id IS NOT NULL THEN 1 ELSE 0 END as has_liked
    FROM posts
    JOIN users ON posts.user_id = users.id
    LEFT JOIN post_likes ON post_likes.post_id = posts.id AND post_likes.user_id = ?
    ORDER BY created_at DESC
  `).all(userId);
}

export function createPost(userId: number, content: string) {
  return db.prepare("INSERT INTO posts (user_id, content) VALUES (?, ?)").run(userId, content);
}

export function getComments(postId: number) {
  return db.prepare(`
    SELECT post_comments.*, users.name as user_name, users.avatar as user_avatar
    FROM post_comments
    JOIN users ON post_comments.user_id = users.id
    WHERE post_comments.post_id = ?
    ORDER BY post_comments.created_at ASC
  `).all(postId);
}

export function createComment(postId: number, userId: number, content: string) {
  const result = db.prepare(
    "INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)"
  ).run(postId, userId, content);

  return db.prepare(`
    SELECT post_comments.*, users.name as user_name, users.avatar as user_avatar
    FROM post_comments
    JOIN users ON post_comments.user_id = users.id
    WHERE post_comments.id = ?
  `).get(result.lastInsertRowid);
}

export function toggleLike(postId: number, userId: number): boolean {
  const existing = db.prepare(
    "SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?"
  ).get(postId, userId);

  if (existing) {
    db.prepare("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?").run(postId, userId);
    db.prepare("UPDATE posts SET likes = likes - 1 WHERE id = ?").run(postId);
    return false;
  } else {
    db.prepare("INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)").run(postId, userId);
    db.prepare("UPDATE posts SET likes = likes + 1 WHERE id = ?").run(postId);
    return true;
  }
}

export function getCommentCount(postId: number) {
  const row = db.prepare(
    "SELECT COUNT(*) as count FROM post_comments WHERE post_id = ?"
  ).get(postId) as { count: number };
  return row.count;
}

export function getTopPosters(limit: number = 5) {
  return db.prepare(`
    SELECT users.id, users.name, users.avatar, COUNT(posts.id) as post_count
    FROM users
    JOIN posts ON posts.user_id = users.id
    GROUP BY users.id
    ORDER BY post_count DESC
    LIMIT ?
  `).all(limit);
}

export function getTrendingPosts(limit: number = 5) {
  return db.prepare(`
    SELECT posts.id, posts.content, posts.likes, users.name as user_name
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.created_at >= datetime('now', '-7 days')
    ORDER BY posts.likes DESC
    LIMIT ?
  `).all(limit);
}
