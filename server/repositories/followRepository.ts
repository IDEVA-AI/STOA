import db from "../db/connection";

export async function follow(followerId: number, followingId: number): Promise<boolean> {
  try {
    await db.run("INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2)", [followerId, followingId]);
    return true;
  } catch {
    return false; // UNIQUE constraint = already following
  }
}

export async function unfollow(followerId: number, followingId: number): Promise<void> {
  await db.run("DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2", [followerId, followingId]);
}

export async function getFollowerCount(userId: number): Promise<number> {
  const row = await db.get<{ count: number }>("SELECT COUNT(*) as count FROM user_follows WHERE following_id = $1", [userId]);
  return row!.count;
}

export async function getFollowingCount(userId: number): Promise<number> {
  const row = await db.get<{ count: number }>("SELECT COUNT(*) as count FROM user_follows WHERE follower_id = $1", [userId]);
  return row!.count;
}

export async function isFollowing(followerId: number, followingId: number): Promise<boolean> {
  const row = await db.get("SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2", [followerId, followingId]);
  return !!row;
}
