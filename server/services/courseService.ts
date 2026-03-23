import * as courseRepo from "../repositories/courseRepository";

export async function listCourses(workspaceId?: number) {
  return await courseRepo.getAllCourses(workspaceId);
}

export async function getCourseContent(courseId: number) {
  return await courseRepo.getCourseModules(courseId);
}
