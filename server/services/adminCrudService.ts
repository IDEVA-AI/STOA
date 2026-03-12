import * as repo from "../repositories/adminCrudRepository";

// ── Courses ──────────────────────────────────────────────────────────

export function listCourses() {
  return repo.listCourses();
}

export function createCourse(title: string, description: string, thumbnail: string) {
  return repo.createCourse(title, description, thumbnail);
}

export function updateCourse(
  id: number,
  data: { title?: string; description?: string; thumbnail?: string }
) {
  return repo.updateCourse(id, data);
}

export function deleteCourse(id: number) {
  return repo.deleteCourse(id);
}

// ── Modules ──────────────────────────────────────────────────────────

export function createModule(courseId: number, title: string, order: number) {
  return repo.createModule(courseId, title, order);
}

export function updateModule(id: number, data: { title?: string; order?: number }) {
  return repo.updateModule(id, data);
}

export function deleteModule(id: number) {
  return repo.deleteModule(id);
}

export function getModulesByCourse(courseId: number) {
  return repo.getModulesByCourse(courseId);
}

// ── Lessons ──────────────────────────────────────────────────────────

export function createLesson(
  moduleId: number,
  title: string,
  contentUrl: string | null,
  contentType: string | null,
  duration: number | null,
  order: number
) {
  return repo.createLesson(moduleId, title, contentUrl, contentType, duration, order);
}

export function updateLesson(
  id: number,
  data: {
    title?: string;
    content_url?: string;
    content_type?: string;
    duration?: number;
    order?: number;
  }
) {
  return repo.updateLesson(id, data);
}

export function deleteLesson(id: number) {
  return repo.deleteLesson(id);
}

export function getLessonsByModule(moduleId: number) {
  return repo.getLessonsByModule(moduleId);
}

// ── Users ────────────────────────────────────────────────────────────

export function listUsers() {
  return repo.listUsers();
}

export function updateUser(id: number, data: { role?: string; is_active?: number }) {
  return repo.updateUser(id, data);
}

export function softDeleteUser(id: number) {
  return repo.softDeleteUser(id);
}
