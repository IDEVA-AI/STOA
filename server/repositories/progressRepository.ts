import db from "../db/connection";

export function getOverallProgress(userId: number) {
  const total = db.prepare(`
    SELECT COUNT(DISTINCT ml.lesson_id) as count
    FROM modules_lessons ml
    JOIN courses_modules cm ON cm.module_id = ml.module_id
  `).get() as { count: number };

  const completed = db.prepare(`
    SELECT COUNT(*) as count FROM lesson_progress WHERE user_id = ?
  `).get(userId) as { count: number };

  const percentage = total.count > 0
    ? Math.round((completed.count / total.count) * 100)
    : 0;

  return {
    completed: completed.count,
    total: total.count,
    percentage,
  };
}

export function getLastAccessedLesson(userId: number) {
  const row = db.prepare(`
    SELECT
      l.title AS lesson_title,
      m.title AS module_title,
      c.title AS course_title,
      c.id AS course_id
    FROM lesson_progress lp
    JOIN lessons l ON l.id = lp.lesson_id
    JOIN modules_lessons ml ON ml.lesson_id = l.id
    JOIN modules m ON m.id = ml.module_id
    JOIN courses_modules cm ON cm.module_id = m.id
    JOIN courses c ON c.id = cm.course_id
    WHERE lp.user_id = ?
    ORDER BY lp.completed_at DESC
    LIMIT 1
  `).get(userId) as { lesson_title: string; module_title: string; course_title: string; course_id: number } | undefined;

  return row || null;
}
