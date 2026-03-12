import * as courseRepo from "../repositories/courseRepository";

export function listCourses(workspaceId?: number) {
  return courseRepo.getAllCourses(workspaceId);
}

export function getCourseContent(courseId: number) {
  return courseRepo.getCourseModules(courseId);
}
