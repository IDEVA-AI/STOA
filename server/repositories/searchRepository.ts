import db from "../db/connection";

interface CourseResult {
  id: number;
  title: string;
  description: string;
}

interface PostResult {
  id: number;
  content: string;
  user_name: string;
}

export interface SearchResults {
  courses: CourseResult[];
  posts: PostResult[];
}

export function search(query: string): SearchResults {
  const pattern = `%${query}%`;

  const courses = db
    .prepare(
      `SELECT id, title, description FROM courses
       WHERE title LIKE ? OR description LIKE ?
       LIMIT 5`
    )
    .all(pattern, pattern) as CourseResult[];

  const posts = db
    .prepare(
      `SELECT p.id, p.content, u.name as user_name
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.content LIKE ?
       LIMIT 5`
    )
    .all(pattern) as PostResult[];

  return { courses, posts };
}
