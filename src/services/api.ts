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
