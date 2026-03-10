import db from "../db/connection";

export function getAllPosts() {
  return db.prepare(`
    SELECT posts.*, users.name as user_name, users.avatar as user_avatar
    FROM posts
    JOIN users ON posts.user_id = users.id
    ORDER BY created_at DESC
  `).all();
}

export function createPost(userId: number, content: string) {
  return db.prepare("INSERT INTO posts (user_id, content) VALUES (?, ?)").run(userId, content);
}
