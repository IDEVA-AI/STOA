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
  has_liked: boolean;
  created_at: string;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  user_name: string;
  user_avatar: string;
  content: string;
  created_at: string;
}

export interface DashboardProgress {
  overall: {
    completed: number;
    total: number;
    percentage: number;
  };
  lastAccessed: {
    lesson_title: string;
    module_title: string;
    course_title: string;
    course_id: number;
  } | null;
}

export interface TopPoster {
  id: number;
  name: string;
  avatar: string;
  post_count: number;
}

export interface TrendingPost {
  id: number;
  content: string;
  likes: number;
  user_name: string;
}

export interface CommunitySidebar {
  topPosters: TopPoster[];
  trendingPosts: TrendingPost[];
}

export interface SearchResults {
  courses: { id: number; title: string; description: string }[];
  posts: { id: number; content: string; user_name: string }[];
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface ApiError {
  error: string;
  message: string;
}

export type AuthMode = 'login' | 'register';

export type TabId = 'dashboard' | 'courses' | 'community' | 'admin' | 'profile' | 'messages' | 'design-system';

export type AdminSection = 'dashboard' | 'communities' | 'courses' | 'media' | 'integrations' | 'unlocks' | 'moderation' | 'settings';

export type Theme = 'light' | 'dark' | 'rust';

export interface Conversation {
  id: number;
  participant: { id: number; name: string; avatar: string };
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar: string;
  content: string;
  created_at: string;
}
