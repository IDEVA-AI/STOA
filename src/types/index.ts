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
  blocks?: LessonBlock[];
}

export interface LessonBlock {
  id?: number;
  lesson_id?: number;
  block_type: 'video' | 'text' | 'image' | 'file' | 'button' | 'divider' | 'callout';
  content: Record<string, any>;
  position: number;
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
  pinned?: boolean;
  category_id?: number | null;
  community_id?: number | null;
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
  phone?: string;
  role: string;
  avatar: string;
}

export interface InviteInfo {
  valid: boolean;
  reason?: string;
  invite?: {
    id: number;
    code: string;
    workspace_id: number;
    product_id: number | null;
    expires_at: string | null;
  };
  workspace?: {
    id: number;
    name: string;
    logo: string | null;
  };
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

export type TabId = 'dashboard' | 'courses' | 'community' | 'admin' | 'profile' | 'messages' | 'design-system' | 'scheduling';

export type AdminSection = 'dashboard' | 'communities' | 'courses' | 'templates' | 'media' | 'integrations' | 'unlocks' | 'moderation' | 'settings' | 'products' | 'trails' | 'workspace' | 'invites' | 'scheduling';

export type Theme = 'light' | 'dark' | 'rust';

export type { StyleSpec, ColorPalette, ThemeConfig } from './theme';
export { VALID_PALETTES, SPEC_LABELS, PALETTE_SWATCHES } from './theme';

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

// ── SaaS Types ─────────────────────────────────────────────────────

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  owner_id: number;
  plan: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  joined_at: string;
}

export interface Product {
  id: number;
  workspace_id: number;
  title: string;
  description: string | null;
  price: number;
  type: 'course' | 'bundle';
  is_published: number;
  created_at: string;
  course_count?: number;
  courses?: Course[];
}

export interface Purchase {
  id: number;
  user_id: number;
  product_id: number;
  workspace_id: number;
  status: 'active' | 'expired' | 'refunded';
  purchased_at: string;
  expires_at: string | null;
  product_title?: string;
  product_price?: number;
}

export interface Trail {
  id: number;
  workspace_id: number;
  title: string;
  description: string | null;
  thumbnail: string | null;
  is_published: number;
  created_at: string;
  course_count?: number;
  courses?: Course[];
}

export interface Community {
  id: number;
  workspace_id: number;
  course_id: number | null;
  name: string;
  description: string | null;
  created_at: string;
  post_count?: number;
  categories?: CommunityCategory[];
}

export interface CommunityCategory {
  id: number;
  community_id: number;
  name: string;
  position: number;
}

// ── Scheduling Types ────────────────────────────────────────────────

export interface AvailabilityConfig {
  id: number;
  workspace_id: number;
  title: string;
  duration_minutes: number;
  buffer_minutes: number;
  max_advance_days: number;
  is_active: number;
  slots?: AvailabilitySlot[];
}

export interface AvailabilitySlot {
  id: number;
  config_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface Booking {
  id: number;
  config_id: number;
  user_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  meet_link: string | null;
  notes: string | null;
  created_at: string;
  config_title?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
}
