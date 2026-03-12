import * as progressRepo from "../repositories/progressRepository";

export function getOverallProgress(userId: number) {
  return progressRepo.getOverallProgress(userId);
}

export function getLastAccessedLesson(userId: number) {
  return progressRepo.getLastAccessedLesson(userId);
}
