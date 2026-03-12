import { Course, Module, Post, Comment, DashboardProgress, CommunitySidebar, SearchResults, Conversation, Message, AuthResponse, AuthUser } from '../types';

// ── Token helpers ──────────────────────────────────────────────────────

const ACCESS_TOKEN_KEY = 'stoa_access_token';
const REFRESH_TOKEN_KEY = 'stoa_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ── Auth-aware fetch wrapper ───────────────────────────────────────────

async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(input, { ...init, headers });

  // If 401 and we have a refresh token, try to refresh once
  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await refreshToken(getRefreshToken()!);
    if (refreshed) {
      setTokens(refreshed.accessToken, refreshed.refreshToken);
      headers.set('Authorization', `Bearer ${refreshed.accessToken}`);
      return fetch(input, { ...init, headers });
    } else {
      clearTokens();
    }
  }

  return res;
}

// ── Auth API ───────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Credenciais invalidas.' }));
    throw new Error(body.message || 'Falha ao fazer login.');
  }
  return res.json();
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Falha ao criar conta.' }));
    throw new Error(body.message || 'Falha ao criar conta.');
  }
  return res.json();
}

export async function refreshToken(token: string): Promise<AuthResponse | null> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getMe(): Promise<AuthUser> {
  const res = await authFetch('/api/auth/me');
  if (!res.ok) throw new Error('Sessao expirada.');
  return res.json();
}

// ── Profile API ───────────────────────────────────────────────────────

export interface ProfileData {
  id: number;
  name: string;
  email: string | null;
  role: string | null;
  avatar: string | null;
  bio: string | null;
}

export async function getProfile(): Promise<ProfileData> {
  const res = await authFetch('/api/profile');
  if (!res.ok) throw new Error('Falha ao carregar perfil.');
  return res.json();
}

export async function updateProfile(data: { name?: string; avatar?: string; bio?: string }): Promise<ProfileData> {
  const res = await authFetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Falha ao atualizar perfil.' }));
    throw new Error(body.error || 'Falha ao atualizar perfil.');
  }
  return res.json();
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  const res = await authFetch('/api/profile/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Falha ao alterar senha.' }));
    throw new Error(body.error || 'Falha ao alterar senha.');
  }
  return res.json();
}

// ── Courses API ────────────────────────────────────────────────────────

export async function getCourses(): Promise<Course[]> {
  const res = await authFetch('/api/courses');
  return res.json();
}

export async function getCourseContent(courseId: number): Promise<Module[]> {
  const res = await authFetch(`/api/courses/${courseId}/content`);
  if (!res.ok) throw new Error('Falha ao carregar o conteudo do curso.');
  return res.json();
}

// ── Feed / Posts API ───────────────────────────────────────────────────

export async function getFeed(): Promise<Post[]> {
  const res = await authFetch('/api/feed');
  return res.json();
}

export async function createPost(content: string, userId: number = 1): Promise<{ id: number }> {
  const res = await authFetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, userId })
  });
  if (!res.ok) throw new Error('Falha ao criar post.');
  return res.json();
}

export async function toggleLike(postId: number): Promise<{ liked: boolean }> {
  const res = await authFetch(`/api/posts/${postId}/like`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Falha ao curtir post.');
  return res.json();
}

export async function getComments(postId: number): Promise<Comment[]> {
  const res = await authFetch(`/api/posts/${postId}/comments`);
  if (!res.ok) throw new Error('Falha ao carregar comentarios.');
  return res.json();
}

export async function createComment(postId: number, userId: number, content: string): Promise<Comment> {
  const res = await authFetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, content })
  });
  if (!res.ok) throw new Error('Falha ao criar comentario.');
  return res.json();
}

// ── Community API ──────────────────────────────────────────────────────

export async function getCommunitySidebar(): Promise<CommunitySidebar> {
  const res = await authFetch('/api/community/sidebar');
  if (!res.ok) throw new Error('Falha ao carregar sidebar da comunidade.');
  return res.json();
}

// ── Progress API ───────────────────────────────────────────────────────

export async function getDashboardProgress(): Promise<DashboardProgress> {
  const res = await authFetch('/api/progress/dashboard');
  if (!res.ok) throw new Error('Falha ao carregar progresso.');
  return res.json();
}

// ── Search API ─────────────────────────────────────────────────────────

export async function search(query: string): Promise<SearchResults> {
  const res = await authFetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Falha ao pesquisar.');
  return res.json();
}

// ── Admin API ──────────────────────────────────────────────────────────

export interface AdminActivity {
  type: 'lesson_completed' | 'new_post' | 'new_user';
  description: string;
  user_name: string;
  user_avatar: string | null;
  created_at: string;
}

export interface AdminStats {
  kpis: {
    members: number;
    courses: number;
    completedLessons: number;
    posts: number;
  };
  recentActivity: AdminActivity[];
}

export async function getAdminStats(): Promise<AdminStats> {
  const res = await authFetch('/api/admin/stats');
  if (!res.ok) throw new Error('Falha ao carregar estatisticas do admin.');
  return res.json();
}

// ── Admin CRUD API ────────────────────────────────────────────────

export interface AdminCourse {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  module_count: number;
  lesson_count: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: number;
  created_at: string;
}

// Courses
export async function getAdminCourses(): Promise<AdminCourse[]> {
  const res = await authFetch('/api/admin/crud/courses');
  if (!res.ok) throw new Error('Falha ao carregar cursos.');
  return res.json();
}

export async function createCourse(data: { title: string; description?: string; thumbnail?: string }): Promise<{ id: number }> {
  const res = await authFetch('/api/admin/crud/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar curso.');
  return res.json();
}

export async function updateCourse(id: number, data: { title?: string; description?: string; thumbnail?: string }): Promise<void> {
  const res = await authFetch(`/api/admin/crud/courses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar curso.');
}

export async function deleteCourse(id: number): Promise<void> {
  const res = await authFetch(`/api/admin/crud/courses/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir curso.');
}

// Modules
export async function createModule(courseId: number, data: { title: string; order?: number }): Promise<{ id: number }> {
  const res = await authFetch(`/api/admin/crud/courses/${courseId}/modules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar modulo.');
  return res.json();
}

export async function updateModule(id: number, data: { title?: string; order?: number }): Promise<void> {
  const res = await authFetch(`/api/admin/crud/modules/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar modulo.');
}

export async function deleteModule(id: number): Promise<void> {
  const res = await authFetch(`/api/admin/crud/modules/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir modulo.');
}

// Lessons
export async function createLesson(moduleId: number, data: { title: string; content_url?: string; content_type?: string; duration?: number; order?: number }): Promise<{ id: number }> {
  const res = await authFetch(`/api/admin/crud/modules/${moduleId}/lessons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar aula.');
  return res.json();
}

export async function updateLesson(id: number, data: { title?: string; content_url?: string; content_type?: string; duration?: number; order?: number }): Promise<void> {
  const res = await authFetch(`/api/admin/crud/lessons/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar aula.');
}

export async function deleteLesson(id: number): Promise<void> {
  const res = await authFetch(`/api/admin/crud/lessons/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir aula.');
}

// Users
export async function getAdminUsers(): Promise<AdminUser[]> {
  const res = await authFetch('/api/admin/crud/users');
  if (!res.ok) throw new Error('Falha ao carregar usuarios.');
  return res.json();
}

export async function updateUser(id: number, data: { role?: string; is_active?: number }): Promise<void> {
  const res = await authFetch(`/api/admin/crud/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar usuario.');
}

export async function deleteUser(id: number): Promise<void> {
  const res = await authFetch(`/api/admin/crud/users/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao desativar usuario.');
}

// ── Messages API ───────────────────────────────────────────────────────

export async function getConversations(userId: number): Promise<Conversation[]> {
  const res = await authFetch(`/api/messages/conversations?userId=${userId}`);
  if (!res.ok) throw new Error('Falha ao carregar conversas.');
  const rows = await res.json();
  return rows.map((r: any) => ({
    id: r.id,
    participant: { id: r.participant_id, name: r.participant_name, avatar: r.participant_avatar },
    last_message: r.last_message,
    last_message_time: r.last_message_time,
    unread_count: r.unread_count,
  }));
}

export async function createConversation(userId: number, targetUserId: number): Promise<{ conversationId: number }> {
  const res = await authFetch('/api/messages/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, targetUserId })
  });
  if (!res.ok) throw new Error('Falha ao criar conversa.');
  return res.json();
}

export async function getMessages(conversationId: number, userId: number, limit?: number, offset?: number): Promise<Message[]> {
  const params = new URLSearchParams({ userId: String(userId) });
  if (limit) params.set('limit', String(limit));
  if (offset) params.set('offset', String(offset));
  const res = await authFetch(`/api/messages/conversations/${conversationId}/messages?${params}`);
  if (!res.ok) throw new Error('Falha ao carregar mensagens.');
  return res.json();
}

export async function pollMessages(conversationId: number, userId: number, afterId: number): Promise<Message[]> {
  const res = await authFetch(`/api/messages/conversations/${conversationId}/messages/poll?userId=${userId}&after_id=${afterId}`);
  if (!res.ok) throw new Error('Falha ao buscar novas mensagens.');
  return res.json();
}

export async function sendMessage(conversationId: number, senderId: number, content: string): Promise<Message> {
  const res = await authFetch(`/api/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senderId, content })
  });
  if (!res.ok) throw new Error('Falha ao enviar mensagem.');
  return res.json();
}

export async function markConversationRead(conversationId: number, userId: number): Promise<void> {
  await authFetch(`/api/messages/conversations/${conversationId}/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
}

export async function getUnreadCount(userId: number): Promise<{ count: number }> {
  const res = await authFetch(`/api/messages/unread-count?userId=${userId}`);
  if (!res.ok) throw new Error('Falha ao carregar contagem de nao lidas.');
  return res.json();
}

// ── Upload API ──────────────────────────────────────────────────────────

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
}

export async function uploadFile(file: File, folder?: string): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  if (folder) formData.append('folder', folder);

  const res = await authFetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Falha no upload.' }));
    throw new Error(body.error || 'Falha no upload.');
  }
  return res.json();
}

export async function uploadImage(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await authFetch('/api/upload/image', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Falha no upload da imagem.' }));
    throw new Error(body.error || 'Falha no upload da imagem.');
  }
  return res.json();
}

// ── Announcements API ─────────────────────────────────────────────────

export interface AnnouncementBlock {
  id: number;
  announcement_id: number;
  block_type: 'text' | 'image' | 'video';
  content: string;
  order: number;
}

export interface Announcement {
  id: number;
  title: string;
  type: string;
  priority: number;
  frequency: string;
  target: string;
  is_active: number;
  expires_at: string | null;
  created_at: string;
  blocks: AnnouncementBlock[];
}

export interface AnnouncementWithCount {
  id: number;
  title: string;
  type: string;
  priority: number;
  frequency: string;
  target: string;
  is_active: number;
  expires_at: string | null;
  created_at: string;
  block_count: number;
}

export interface AnnouncementInput {
  title: string;
  type?: string;
  priority?: number;
  frequency?: string;
  target?: string;
  is_active?: number;
  expires_at?: string | null;
  blocks?: { block_type: string; content: string; order: number }[];
}

export async function getPendingAnnouncements(): Promise<Announcement[]> {
  const res = await authFetch('/api/announcements/pending');
  if (!res.ok) throw new Error('Falha ao carregar anuncios pendentes.');
  return res.json();
}

export async function confirmAnnouncement(id: number): Promise<{ success: boolean }> {
  const res = await authFetch(`/api/announcements/${id}/confirm`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Falha ao confirmar anuncio.');
  return res.json();
}

export async function getAnnouncements(): Promise<AnnouncementWithCount[]> {
  const res = await authFetch('/api/announcements');
  if (!res.ok) throw new Error('Falha ao carregar anuncios.');
  return res.json();
}

export async function getAnnouncement(id: number): Promise<Announcement> {
  const res = await authFetch(`/api/announcements/${id}`);
  if (!res.ok) throw new Error('Falha ao carregar anuncio.');
  return res.json();
}

export async function createAnnouncement(data: AnnouncementInput): Promise<Announcement> {
  const res = await authFetch('/api/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar anuncio.');
  return res.json();
}

export async function updateAnnouncement(id: number, data: AnnouncementInput): Promise<Announcement> {
  const res = await authFetch(`/api/announcements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar anuncio.');
  return res.json();
}

export async function deleteAnnouncement(id: number): Promise<{ success: boolean }> {
  const res = await authFetch(`/api/announcements/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Falha ao excluir anuncio.');
  return res.json();
}
