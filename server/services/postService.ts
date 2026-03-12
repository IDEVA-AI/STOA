import * as postRepo from "../repositories/postRepository";

export function listPosts(userId: number = 1) {
  return postRepo.getAllPosts(userId);
}

export function toggleLike(postId: number, userId: number) {
  return postRepo.toggleLike(postId, userId);
}

export function createPost(userId: number, content: string) {
  return postRepo.createPost(userId, content);
}

export function getComments(postId: number) {
  return postRepo.getComments(postId);
}

export function createComment(postId: number, userId: number, content: string) {
  return postRepo.createComment(postId, userId, content);
}

export function getTopPosters(limit: number = 5) {
  return postRepo.getTopPosters(limit);
}

export function getTrendingPosts(limit: number = 5) {
  return postRepo.getTrendingPosts(limit);
}
