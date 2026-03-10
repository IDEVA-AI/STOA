import * as courseRepo from "../repositories/courseRepository";

export function listCourses() {
  return courseRepo.getAllCourses();
}

export function getCourseContent(courseId: number) {
  return courseRepo.getCourseModules(courseId);
}
