import db from "../db/connection";

interface StatsRow {
  total_users: number;
  total_courses: number;
  total_completed_lessons: number;
  total_posts: number;
}

export interface ActivityEntry {
  type: "lesson_completed" | "new_post" | "new_user";
  description: string;
  user_name: string;
  user_avatar: string | null;
  created_at: string;
}

export function getStats(): StatsRow {
  return db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM courses) as total_courses,
      (SELECT COUNT(*) FROM lesson_progress) as total_completed_lessons,
      (SELECT COUNT(*) FROM posts) as total_posts
  `).get() as StatsRow;
}

export function getRecentActivity(limit: number = 10): ActivityEntry[] {
  return db.prepare(`
    SELECT * FROM (
      SELECT
        'lesson_completed' as type,
        'concluiu a aula "' || l.title || '"' as description,
        u.name as user_name,
        u.avatar as user_avatar,
        lp.completed_at as created_at
      FROM lesson_progress lp
      JOIN users u ON lp.user_id = u.id
      JOIN lessons l ON lp.lesson_id = l.id

      UNION ALL

      SELECT
        'new_post' as type,
        'publicou no feed' as description,
        u.name as user_name,
        u.avatar as user_avatar,
        p.created_at as created_at
      FROM posts p
      JOIN users u ON p.user_id = u.id

      UNION ALL

      SELECT
        'new_user' as type,
        'entrou na plataforma' as description,
        u.name as user_name,
        u.avatar as user_avatar,
        '' as created_at
      FROM users u
    )
    WHERE created_at != ''
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit) as ActivityEntry[];
}
