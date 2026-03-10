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

export type AuthMode = 'login' | 'register';

export type TabId = 'dashboard' | 'courses' | 'community' | 'admin' | 'profile' | 'messages' | 'design-system';

export type AdminSection = 'dashboard' | 'communities' | 'courses' | 'media' | 'integrations' | 'unlocks' | 'moderation' | 'settings';

export type Theme = 'light' | 'dark' | 'rust';

export interface Conversation {
  id: number;
  name: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
  role: string;
}

export interface Message {
  id: number;
  senderId: number;
  content: string;
  time: string;
  isOwn: boolean;
}
