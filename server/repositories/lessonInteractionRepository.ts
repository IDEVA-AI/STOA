import db from "../db/connection";

// ── Ratings ──

export async function upsertRating(lessonId: number, userId: number, rating: number) {
  await db.run(
    `INSERT INTO lesson_ratings (lesson_id, user_id, rating)
     VALUES ($1, $2, $3)
     ON CONFLICT (lesson_id, user_id) DO UPDATE SET rating = $3, updated_at = NOW()`,
    [lessonId, userId, rating]
  );
  return getRatingStats(lessonId, userId);
}

export async function getRatingStats(lessonId: number, userId?: number) {
  const stats = await db.get<{ avg: number; count: number }>(
    `SELECT COALESCE(AVG(rating), 0)::float AS avg, COUNT(*)::int AS count
     FROM lesson_ratings WHERE lesson_id = $1`,
    [lessonId]
  );

  let userRating: number | null = null;
  if (userId) {
    const row = await db.get<{ rating: number }>(
      `SELECT rating FROM lesson_ratings WHERE lesson_id = $1 AND user_id = $2`,
      [lessonId, userId]
    );
    userRating = row?.rating ?? null;
  }

  return {
    average: Math.round((stats?.avg ?? 0) * 10) / 10,
    count: stats?.count ?? 0,
    userRating,
  };
}

// ── Comments ──

export async function getComments(lessonId: number) {
  return db.all(
    `SELECT lc.*, u.name AS user_name, u.avatar AS user_avatar, u.role AS user_role
     FROM lesson_comments lc
     JOIN users u ON u.id = lc.user_id
     WHERE lc.lesson_id = $1
     ORDER BY lc.created_at ASC`,
    [lessonId]
  );
}

export async function createComment(lessonId: number, userId: number, content: string) {
  const result = await db.run(
    `INSERT INTO lesson_comments (lesson_id, user_id, content)
     VALUES ($1, $2, $3) RETURNING id`,
    [lessonId, userId, content]
  );
  const id = result.rows[0].id;
  const rows = await db.all(
    `SELECT lc.*, u.name AS user_name, u.avatar AS user_avatar, u.role AS user_role
     FROM lesson_comments lc
     JOIN users u ON u.id = lc.user_id
     WHERE lc.id = $1`,
    [id]
  );
  return rows[0];
}

export async function deleteComment(id: number, userId: number, userRole: string) {
  if (userRole === "admin") {
    await db.run(`DELETE FROM lesson_comments WHERE id = $1`, [id]);
  } else {
    await db.run(`DELETE FROM lesson_comments WHERE id = $1 AND user_id = $2`, [id, userId]);
  }
}
