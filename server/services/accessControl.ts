import * as purchaseService from "./purchaseService";

// Check if user has purchased access to a course
export async function canAccessCourse(userId: number, courseId: number): Promise<boolean> {
  return await purchaseService.hasAccess(userId, courseId);
}

// Get all course IDs a user can access
export async function getAccessibleCourseIds(userId: number): Promise<number[]> {
  return await purchaseService.getUserCourseIds(userId);
}
