import * as postRepo from "../repositories/postRepository";

export function listPosts() {
  return postRepo.getAllPosts();
}

export function createPost(userId: number, content: string) {
  return postRepo.createPost(userId, content);
}
