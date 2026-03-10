export interface User {
  id: number;
  name: string;
  avatar: string;
  role: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  lessons_count: number;
  progress: number;
}

export interface Module {
  id: number;
  course_id: number;
  title: string;
  order: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: number;
  module_id: number;
  title: string;
  content_url?: string;
  content_type?: 'video' | 'pdf' | 'text';
  duration?: number;
  order: number;
  completed?: boolean;
}

export interface Post {
  id: number;
  user_id: number;
  user_name: string;
  user_avatar: string;
  content: string;
  likes: number;
  created_at: string;
}
