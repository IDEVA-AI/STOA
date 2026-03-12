import * as trailRepo from "../repositories/trailRepository";

export function listByWorkspace(workspaceId: number) {
  return trailRepo.getByWorkspace(workspaceId);
}

export function getById(id: number) {
  return trailRepo.getById(id);
}

export function getWithCourses(id: number) {
  return trailRepo.getWithCourses(id);
}

export function create(data: {
  workspace_id: number;
  title: string;
  description?: string;
  thumbnail?: string;
  is_published?: number;
  courseIds?: number[];
}) {
  const { courseIds, ...trailData } = data;
  const result = trailRepo.create(trailData);
  if (courseIds && courseIds.length > 0) {
    trailRepo.setCourses(Number(result.id), courseIds);
  }
  return result;
}

export function update(
  id: number,
  data: Partial<{ title: string; description: string; thumbnail: string; is_published: number; courseIds: number[] }>
) {
  const { courseIds, ...trailData } = data;
  trailRepo.update(id, trailData);
  if (courseIds !== undefined) {
    trailRepo.setCourses(id, courseIds);
  }
}

export function remove(id: number) {
  trailRepo.remove(id);
}

export function setCourses(trailId: number, courseIds: number[]) {
  trailRepo.setCourses(trailId, courseIds);
}

export function reorderCourses(trailId: number, courseIds: number[]) {
  trailRepo.reorderCourses(trailId, courseIds);
}
