import * as repo from "../repositories/adminCrudRepository";

// ── Courses ──────────────────────────────────────────────────────────

export async function listCourses() {
  return await repo.listCourses();
}

export async function createCourse(title: string, description: string, thumbnail: string) {
  return await repo.createCourse(title, description, thumbnail);
}

export async function updateCourse(
  id: number,
  data: { title?: string; description?: string; thumbnail?: string }
) {
  return await repo.updateCourse(id, data);
}

export async function deleteCourse(id: number) {
  return await repo.deleteCourse(id);
}

// ── Modules ──────────────────────────────────────────────────────────

export async function createModule(courseId: number, title: string, order: number) {
  return await repo.createModule(courseId, title, order);
}

export async function updateModule(id: number, data: { title?: string; order?: number }) {
  return await repo.updateModule(id, data);
}

export async function deleteModule(id: number) {
  return await repo.deleteModule(id);
}

export async function getModulesByCourse(courseId: number) {
  return await repo.getModulesByCourse(courseId);
}

// ── Lessons ──────────────────────────────────────────────────────────

export async function createLesson(
  moduleId: number,
  title: string,
  contentUrl: string | null,
  contentType: string | null,
  duration: number | null,
  order: number
) {
  return await repo.createLesson(moduleId, title, contentUrl, contentType, duration, order);
}

export async function updateLesson(
  id: number,
  data: {
    title?: string;
    content_url?: string;
    content_type?: string;
    duration?: number;
    order?: number;
  }
) {
  return await repo.updateLesson(id, data);
}

export async function deleteLesson(id: number) {
  return await repo.deleteLesson(id);
}

export async function getLessonsByModule(moduleId: number) {
  return await repo.getLessonsByModule(moduleId);
}

// ── Users ────────────────────────────────────────────────────────────

export async function listUsers() {
  return await repo.listUsers();
}

export async function updateUser(id: number, data: { role?: string; is_active?: number }) {
  return await repo.updateUser(id, data);
}

export async function softDeleteUser(id: number) {
  return await repo.softDeleteUser(id);
}
