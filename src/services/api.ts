import { Course, Module, Post, Comment, DashboardProgress, CommunitySidebar, SearchResults, Conversation, Message, AuthResponse, AuthUser, InviteInfo, Workspace, WorkspaceMember, Product, Purchase, Trail, Community, CommunityCategory, LessonBlock, AvailabilityConfig, TimeSlot, Booking } from '../types';

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

export async function register(
  name: string,
  email: string,
  password: string,
  phone?: string,
  inviteCode?: string
): Promise<AuthResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone, inviteCode }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Falha ao criar conta.' }));
    throw new Error(body.error || body.message || 'Falha ao criar conta.');
  }
  return res.json();
}

export async function validateInvite(code: string): Promise<InviteInfo> {
  const res = await fetch(`/api/invites/validate/${encodeURIComponent(code)}`);
  if (!res.ok) return { valid: false, reason: 'Convite nao encontrado' };
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

export interface LibraryItem {
  name: string;
  url: string;
  size: number;
  lastChanged: string;
  type: 'image' | 'video' | 'file';
  folder: string;
}

export async function getLibrary(): Promise<LibraryItem[]> {
  const res = await authFetch('/api/upload/library');
  if (!res.ok) throw new Error('Falha ao carregar biblioteca.');
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

// ── Workspaces API ────────────────────────────────────────────────

export async function getMyWorkspaces(): Promise<Workspace[]> {
  const res = await authFetch('/api/workspaces');
  if (!res.ok) throw new Error('Falha ao carregar workspaces.');
  return res.json();
}

export async function getWorkspaceBySlug(slug: string): Promise<Workspace> {
  const res = await authFetch(`/api/workspaces/${slug}`);
  if (!res.ok) throw new Error('Workspace nao encontrado.');
  return res.json();
}

export async function createWorkspace(data: { name: string; slug: string; logo?: string }): Promise<{ id: number }> {
  const res = await authFetch('/api/workspaces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar workspace.');
  return res.json();
}

export async function updateWorkspace(id: number, data: { name?: string; slug?: string; logo?: string }): Promise<void> {
  const res = await authFetch(`/api/workspaces/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar workspace.');
}

export async function getWorkspaceMembers(workspaceId: number): Promise<WorkspaceMember[]> {
  const res = await authFetch(`/api/workspaces/${workspaceId}/members`);
  if (!res.ok) throw new Error('Falha ao carregar membros.');
  return res.json();
}

export async function addWorkspaceMember(workspaceId: number, userId: number, role?: string): Promise<void> {
  const res = await authFetch(`/api/workspaces/${workspaceId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, role }),
  });
  if (!res.ok) throw new Error('Falha ao adicionar membro.');
}

export async function updateWorkspaceMemberRole(workspaceId: number, userId: number, role: string): Promise<void> {
  const res = await authFetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error('Falha ao atualizar membro.');
}

export async function removeWorkspaceMember(workspaceId: number, userId: number): Promise<void> {
  const res = await authFetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Falha ao remover membro.');
}

// ── Products API ──────────────────────────────────────────────────

export async function getProducts(workspaceId: number): Promise<Product[]> {
  const res = await authFetch(`/api/products/workspace/${workspaceId}`);
  if (!res.ok) throw new Error('Falha ao carregar produtos.');
  return res.json();
}

export async function getProduct(id: number): Promise<Product> {
  const res = await authFetch(`/api/products/${id}`);
  if (!res.ok) throw new Error('Falha ao carregar produto.');
  return res.json();
}

export async function createProduct(data: { workspace_id: number; title: string; description?: string; price?: number; type?: string; is_published?: number; courseIds?: number[] }): Promise<{ id: number }> {
  const res = await authFetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar produto.');
  return res.json();
}

export async function updateProduct(id: number, data: Partial<{ title: string; description: string; price: number; type: string; is_published: number; courseIds: number[] }>): Promise<void> {
  const res = await authFetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar produto.');
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await authFetch(`/api/products/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir produto.');
}

// ── Purchases API ─────────────────────────────────────────────────

export async function getMyPurchases(): Promise<Purchase[]> {
  const res = await authFetch('/api/purchases/my');
  if (!res.ok) throw new Error('Falha ao carregar compras.');
  return res.json();
}

export async function checkCourseAccess(courseId: number): Promise<{ hasAccess: boolean }> {
  const res = await authFetch(`/api/purchases/check/${courseId}`);
  if (!res.ok) throw new Error('Falha ao verificar acesso.');
  return res.json();
}

export async function getMyAccessibleCourseIds(): Promise<{ courseIds: number[] }> {
  const res = await authFetch('/api/purchases/my/courses');
  if (!res.ok) throw new Error('Falha ao carregar cursos acessiveis.');
  return res.json();
}

export async function createPurchase(data: { product_id: number; workspace_id: number }): Promise<{ id: number }> {
  const res = await authFetch('/api/purchases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao registrar compra.');
  return res.json();
}

export async function getWorkspacePurchases(workspaceId: number): Promise<Purchase[]> {
  const res = await authFetch(`/api/purchases/workspace/${workspaceId}`);
  if (!res.ok) throw new Error('Falha ao carregar vendas.');
  return res.json();
}

// ── Trails API ────────────────────────────────────────────────────

export async function getTrails(workspaceId: number): Promise<Trail[]> {
  const res = await authFetch(`/api/trails/workspace/${workspaceId}`);
  if (!res.ok) throw new Error('Falha ao carregar trilhas.');
  return res.json();
}

export async function getTrail(id: number): Promise<Trail> {
  const res = await authFetch(`/api/trails/${id}`);
  if (!res.ok) throw new Error('Falha ao carregar trilha.');
  return res.json();
}

export async function createTrail(data: { workspace_id: number; title: string; description?: string; thumbnail?: string; courseIds?: number[] }): Promise<{ id: number }> {
  const res = await authFetch('/api/trails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar trilha.');
  return res.json();
}

export async function updateTrail(id: number, data: Partial<{ title: string; description: string; thumbnail: string; is_published: number; courseIds: number[] }>): Promise<void> {
  const res = await authFetch(`/api/trails/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar trilha.');
}

export async function deleteTrail(id: number): Promise<void> {
  const res = await authFetch(`/api/trails/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir trilha.');
}

// ── Communities API ───────────────────────────────────────────────

export async function getCommunities(workspaceId: number): Promise<Community[]> {
  const res = await authFetch(`/api/communities/workspace/${workspaceId}`);
  if (!res.ok) throw new Error('Falha ao carregar comunidades.');
  return res.json();
}

export async function getCourseCommunity(courseId: number): Promise<Community> {
  const res = await authFetch(`/api/communities/course/${courseId}`);
  if (!res.ok) throw new Error('Falha ao carregar comunidade do curso.');
  return res.json();
}

export async function getCommunity(id: number): Promise<Community> {
  const res = await authFetch(`/api/communities/${id}`);
  if (!res.ok) throw new Error('Falha ao carregar comunidade.');
  return res.json();
}

export async function createCommunity(data: { workspace_id: number; course_id?: number; name: string; description?: string }): Promise<{ id: number }> {
  const res = await authFetch('/api/communities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar comunidade.');
  return res.json();
}

export async function updateCommunity(id: number, data: { name?: string; description?: string }): Promise<void> {
  const res = await authFetch(`/api/communities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar comunidade.');
}

export async function deleteCommunity(id: number): Promise<void> {
  const res = await authFetch(`/api/communities/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir comunidade.');
}

export async function getCommunityPosts(communityId: number, opts?: { categoryId?: number; limit?: number; offset?: number }): Promise<Post[]> {
  const params = new URLSearchParams();
  if (opts?.categoryId) params.set('categoryId', String(opts.categoryId));
  if (opts?.limit) params.set('limit', String(opts.limit));
  if (opts?.offset) params.set('offset', String(opts.offset));
  const qs = params.toString() ? `?${params}` : '';
  const res = await authFetch(`/api/communities/${communityId}/posts${qs}`);
  if (!res.ok) throw new Error('Falha ao carregar posts.');
  return res.json();
}

export async function createCommunityPost(communityId: number, content: string, categoryId?: number): Promise<{ id: number }> {
  const body: Record<string, unknown> = { content };
  if (categoryId) body.categoryId = categoryId;
  const res = await authFetch(`/api/communities/${communityId}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Falha ao criar post na comunidade.');
  return res.json();
}

export async function getCommunityCategories(communityId: number): Promise<CommunityCategory[]> {
  const res = await authFetch(`/api/communities/${communityId}/categories`);
  if (!res.ok) throw new Error('Falha ao carregar categorias.');
  return res.json();
}

export async function createCommunityCategory(communityId: number, name: string, position?: number): Promise<{ id: number }> {
  const res = await authFetch(`/api/communities/${communityId}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, position }),
  });
  if (!res.ok) throw new Error('Falha ao criar categoria.');
  return res.json();
}

// ── Lesson Blocks API ─────────────────────────────────────────────

export async function getLessonBlocks(lessonId: number): Promise<LessonBlock[]> {
  const res = await authFetch(`/api/lesson-blocks/lesson/${lessonId}`);
  if (!res.ok) throw new Error('Falha ao carregar blocos.');
  return res.json();
}

export async function createLessonBlock(data: { lesson_id: number; block_type: string; content: Record<string, any>; position?: number }): Promise<{ id: number }> {
  const res = await authFetch('/api/lesson-blocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar bloco.');
  return res.json();
}

export async function updateLessonBlock(id: number, data: Partial<{ block_type: string; content: Record<string, any>; position: number }>): Promise<void> {
  const res = await authFetch(`/api/lesson-blocks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar bloco.');
}

export async function deleteLessonBlock(id: number): Promise<void> {
  const res = await authFetch(`/api/lesson-blocks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir bloco.');
}

export async function reorderLessonBlocks(lessonId: number, blockIds: number[]): Promise<void> {
  const res = await authFetch(`/api/lesson-blocks/lesson/${lessonId}/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blockIds }),
  });
  if (!res.ok) throw new Error('Falha ao reordenar blocos.');
}

export async function setLessonBlocks(lessonId: number, blocks: { block_type: string; content: Record<string, any>; position: number }[]): Promise<{ ids: number[] }> {
  const res = await authFetch(`/api/lesson-blocks/lesson/${lessonId}/batch`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });
  if (!res.ok) throw new Error('Falha ao salvar blocos.');
  return res.json();
}

// ── Lesson Templates API ──────────────────────────────────────────

export interface LessonTemplate {
  id: number;
  workspace_id: number;
  name: string;
  description: string | null;
  thumbnail: string | null;
  is_default: number;
  created_at: string;
  block_count?: number;
  blocks?: LessonBlock[];
}

export async function getLessonTemplates(workspaceId: number): Promise<LessonTemplate[]> {
  const res = await authFetch(`/api/lesson-templates/workspace/${workspaceId}`);
  if (!res.ok) throw new Error('Falha ao carregar templates.');
  return res.json();
}

export async function getLessonTemplate(id: number): Promise<LessonTemplate> {
  const res = await authFetch(`/api/lesson-templates/${id}`);
  if (!res.ok) throw new Error('Falha ao carregar template.');
  return res.json();
}

export async function createLessonTemplate(data: { workspace_id: number; name: string; description?: string; blocks?: { block_type: string; content: Record<string, any>; position: number }[] }): Promise<{ id: number }> {
  const res = await authFetch('/api/lesson-templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar template.');
  return res.json();
}

export async function updateLessonTemplate(id: number, data: Partial<{ name: string; description: string; is_default: number; blocks: { block_type: string; content: Record<string, any>; position: number }[] }>): Promise<void> {
  const res = await authFetch(`/api/lesson-templates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar template.');
}

export async function deleteLessonTemplate(id: number): Promise<void> {
  const res = await authFetch(`/api/lesson-templates/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao excluir template.');
}

export async function createTemplateFromLesson(workspaceId: number, lessonId: number, name: string): Promise<{ id: number }> {
  const res = await authFetch('/api/lesson-templates/from-lesson', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspace_id: workspaceId, lesson_id: lessonId, name }),
  });
  if (!res.ok) throw new Error('Falha ao criar template da aula.');
  return res.json();
}

export async function applyTemplateToLesson(templateId: number, lessonId: number): Promise<void> {
  const res = await authFetch(`/api/lesson-templates/${templateId}/apply/${lessonId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Falha ao aplicar template.');
}

// ── Invites API ──────────────────────────────────────────────────────

export async function createInvite(data: { workspace_id: number; product_id?: number; max_uses?: number; expires_at?: string }): Promise<{ id: number; code: string }> {
  const res = await authFetch('/api/invites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar convite.');
  return res.json();
}

export async function getWorkspaceInvites(workspaceId: number): Promise<any[]> {
  const res = await authFetch(`/api/invites/workspace/${workspaceId}`);
  if (!res.ok) throw new Error('Falha ao carregar convites.');
  return res.json();
}

export async function revokeInvite(id: number): Promise<void> {
  const res = await authFetch(`/api/invites/${id}/revoke`, { method: 'PUT' });
  if (!res.ok) throw new Error('Falha ao revogar convite.');
}

export async function deleteInvite(id: number): Promise<void> {
  const res = await authFetch(`/api/invites/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao deletar convite.');
}

export async function getInviteRedemptions(id: number): Promise<any[]> {
  const res = await authFetch(`/api/invites/${id}/redemptions`);
  if (!res.ok) throw new Error('Falha ao carregar resgates.');
  return res.json();
}

// ── Scheduling API ──────────────────────────────────────────────────

export async function getSchedulingConfigs(workspaceId: number): Promise<AvailabilityConfig[]> {
  const res = await authFetch(`/api/scheduling/configs/workspace/${workspaceId}`);
  if (!res.ok) throw new Error('Falha ao carregar agendas.');
  return res.json();
}

export async function getSchedulingConfig(configId: number): Promise<AvailabilityConfig> {
  const res = await authFetch(`/api/scheduling/configs/${configId}`);
  if (!res.ok) throw new Error('Falha ao carregar agenda.');
  return res.json();
}

export async function createSchedulingConfig(data: Partial<AvailabilityConfig>): Promise<AvailabilityConfig> {
  const res = await authFetch('/api/scheduling/configs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar agenda.');
  return res.json();
}

export async function updateSchedulingConfig(id: number, data: Partial<AvailabilityConfig>): Promise<AvailabilityConfig> {
  const res = await authFetch(`/api/scheduling/configs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar agenda.');
  return res.json();
}

export async function deleteSchedulingConfig(id: number): Promise<void> {
  const res = await authFetch(`/api/scheduling/configs/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao deletar agenda.');
}

export async function setSchedulingSlots(configId: number, slots: Array<{ day_of_week: number; start_time: string; end_time: string }>): Promise<AvailabilityConfig> {
  const res = await authFetch(`/api/scheduling/configs/${configId}/slots`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slots }),
  });
  if (!res.ok) throw new Error('Falha ao salvar horarios.');
  return res.json();
}

export async function getAvailableTimes(configId: number, date: string): Promise<TimeSlot[]> {
  const res = await authFetch(`/api/scheduling/available/${configId}/${date}`);
  if (!res.ok) throw new Error('Falha ao carregar horarios.');
  return res.json();
}

export async function bookSlot(data: { config_id: number; date: string; start_time: string }): Promise<Booking> {
  const res = await authFetch('/api/scheduling/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Falha ao agendar.' }));
    throw new Error(body.error || 'Falha ao agendar.');
  }
  return res.json();
}

export async function getMyBookings(): Promise<Booking[]> {
  const res = await authFetch('/api/scheduling/my-bookings');
  if (!res.ok) throw new Error('Falha ao carregar agendamentos.');
  return res.json();
}

export async function cancelBooking(id: number): Promise<void> {
  const res = await authFetch(`/api/scheduling/bookings/${id}/cancel`, { method: 'PUT' });
  if (!res.ok) throw new Error('Falha ao cancelar agendamento.');
}

export async function getConfigBookings(configId: number): Promise<Booking[]> {
  const res = await authFetch(`/api/scheduling/configs/${configId}/bookings`);
  if (!res.ok) throw new Error('Falha ao carregar agendamentos.');
  return res.json();
}

export async function updateBookingNotes(id: number, notes: string): Promise<void> {
  const res = await authFetch(`/api/scheduling/bookings/${id}/notes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) throw new Error('Falha ao salvar notas.');
}
