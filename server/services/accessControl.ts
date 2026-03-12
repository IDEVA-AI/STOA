import * as purchaseService from "./purchaseService";

// Check if user has purchased access to a course
export function canAccessCourse(userId: number, courseId: number): boolean {
  return purchaseService.hasAccess(userId, courseId);
}

// Get all course IDs a user can access
export function getAccessibleCourseIds(userId: number): number[] {
  return purchaseService.getUserCourseIds(userId);
}
