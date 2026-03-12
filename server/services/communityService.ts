import * as communityRepo from "../repositories/communityRepository";

export function listByWorkspace(workspaceId: number) {
  return communityRepo.getByWorkspace(workspaceId);
}

export function getByCourse(courseId: number) {
  return communityRepo.getByCourse(courseId);
}

export function getById(id: number) {
  return communityRepo.getById(id);
}

export function create(data: {
  workspace_id: number;
  course_id?: number;
  name: string;
  description?: string;
}) {
  return communityRepo.create(data);
}

export function update(id: number, data: Partial<{ name: string; description: string }>) {
  communityRepo.update(id, data);
}

export function remove(id: number) {
  communityRepo.remove(id);
}

export function getCategories(communityId: number) {
  return communityRepo.getCategories(communityId);
}

export function createCategory(communityId: number, name: string, position: number) {
  return communityRepo.createCategory(communityId, name, position);
}

export function updateCategory(categoryId: number, data: Partial<{ name: string; position: number }>) {
  communityRepo.updateCategory(categoryId, data);
}

export function removeCategory(categoryId: number) {
  communityRepo.removeCategory(categoryId);
}

export function getPosts(
  communityId: number,
  opts: { categoryId?: number; userId?: number; limit?: number; offset?: number } = {}
) {
  return communityRepo.getPosts(communityId, opts);
}

export function getPinnedPosts(communityId: number) {
  return communityRepo.getPinnedPosts(communityId);
}
