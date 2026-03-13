import db from "../db/connection";

export function follow(followerId: number, followingId: number): boolean {
  try {
    db.prepare("INSERT INTO user_follows (follower_id, following_id) VALUES (?, ?)").run(followerId, followingId);
    return true;
  } catch {
    return false; // UNIQUE constraint = already following
  }
}

export function unfollow(followerId: number, followingId: number): void {
  db.prepare("DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?").run(followerId, followingId);
}

export function getFollowerCount(userId: number): number {
  const row = db.prepare("SELECT COUNT(*) as count FROM user_follows WHERE following_id = ?").get(userId) as { count: number };
  return row.count;
}

export function getFollowingCount(userId: number): number {
  const row = db.prepare("SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ?").get(userId) as { count: number };
  return row.count;
}

export function isFollowing(followerId: number, followingId: number): boolean {
  const row = db.prepare("SELECT 1 FROM user_follows WHERE follower_id = ? AND following_id = ?").get(followerId, followingId);
  return !!row;
}
