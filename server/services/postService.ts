import * as postRepo from "../repositories/postRepository";

export async function listPosts(userId: number = 1) {
  return await postRepo.getAllPosts(userId);
}

export async function toggleLike(postId: number, userId: number) {
  return await postRepo.toggleLike(postId, userId);
}

export async function createPost(userId: number, content: string) {
  return await postRepo.createPost(userId, content);
}

export async function getComments(postId: number) {
  return await postRepo.getComments(postId);
}

export async function createComment(postId: number, userId: number, content: string) {
  return await postRepo.createComment(postId, userId, content);
}

export async function getTopPosters(limit: number = 5) {
  return await postRepo.getTopPosters(limit);
}

export async function getTrendingPosts(limit: number = 5) {
  return await postRepo.getTrendingPosts(limit);
}
