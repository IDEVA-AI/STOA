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

export async function search(query: string): Promise<SearchResults> {
  const pattern = `%${query}%`;

  const courses = await db.all<CourseResult>(
    `SELECT id, title, description FROM courses
     WHERE title ILIKE $1 OR description ILIKE $2
     LIMIT 5`,
    [pattern, pattern]
  );

  const posts = await db.all<PostResult>(
    `SELECT p.id, p.content, u.name as user_name
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.content ILIKE $1
     LIMIT 5`,
    [pattern]
  );

  return { courses, posts };
}
