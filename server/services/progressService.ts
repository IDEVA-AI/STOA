import * as progressRepo from "../repositories/progressRepository";

export async function getOverallProgress(userId: number) {
  return await progressRepo.getOverallProgress(userId);
}

export async function getLastAccessedLesson(userId: number) {
  return await progressRepo.getLastAccessedLesson(userId);
}
