import * as communityRepo from "../repositories/communityRepository";

export async function listByWorkspace(workspaceId: number) {
  return await communityRepo.getByWorkspace(workspaceId);
}

export async function getByCourse(courseId: number) {
  return await communityRepo.getByCourse(courseId);
}

export async function getById(id: number) {
  return await communityRepo.getById(id);
}

export async function create(data: {
  workspace_id: number;
  course_id?: number;
  name: string;
  description?: string;
}) {
  return await communityRepo.create(data);
}

export async function update(id: number, data: Partial<{ name: string; description: string }>) {
  await communityRepo.update(id, data);
}

export async function remove(id: number) {
  await communityRepo.remove(id);
}

export async function getCategories(communityId: number) {
  return await communityRepo.getCategories(communityId);
}

export async function createCategory(communityId: number, name: string, position: number) {
  return await communityRepo.createCategory(communityId, name, position);
}

export async function updateCategory(categoryId: number, data: Partial<{ name: string; position: number }>) {
  await communityRepo.updateCategory(categoryId, data);
}

export async function removeCategory(categoryId: number) {
  await communityRepo.removeCategory(categoryId);
}

export async function getPosts(
  communityId: number,
  opts: { categoryId?: number; userId?: number; limit?: number; offset?: number } = {}
) {
  return await communityRepo.getPosts(communityId, opts);
}

export async function getPinnedPosts(communityId: number) {
  return await communityRepo.getPinnedPosts(communityId);
}

export async function createPost(communityId: number, userId: number, content: string, categoryId?: number) {
  return await communityRepo.createPost(communityId, userId, content, categoryId);
}

export async function getPostById(postId: number) {
  return await communityRepo.getPostById(postId);
}

export async function togglePin(postId: number) {
  return await communityRepo.togglePin(postId);
}

export async function deletePost(postId: number) {
  await communityRepo.deletePost(postId);
}

export async function updatePost(postId: number, content: string) {
  await communityRepo.updatePost(postId, content);
}
