import * as trailRepo from "../repositories/trailRepository";

export async function listByWorkspace(workspaceId: number) {
  return await trailRepo.getByWorkspace(workspaceId);
}

export async function getById(id: number) {
  return await trailRepo.getById(id);
}

export async function getWithCourses(id: number) {
  return await trailRepo.getWithCourses(id);
}

export async function create(data: {
  workspace_id: number;
  title: string;
  description?: string;
  thumbnail?: string;
  is_published?: number;
  courseIds?: number[];
}) {
  const { courseIds, ...trailData } = data;
  const result = await trailRepo.create(trailData);
  if (courseIds && courseIds.length > 0) {
    await trailRepo.setCourses(Number(result.id), courseIds);
  }
  return result;
}

export async function update(
  id: number,
  data: Partial<{ title: string; description: string; thumbnail: string; is_published: number; courseIds: number[] }>
) {
  const { courseIds, ...trailData } = data;
  await trailRepo.update(id, trailData);
  if (courseIds !== undefined) {
    await trailRepo.setCourses(id, courseIds);
  }
}

export async function remove(id: number) {
  await trailRepo.remove(id);
}

export async function setCourses(trailId: number, courseIds: number[]) {
  await trailRepo.setCourses(trailId, courseIds);
}

export async function reorderCourses(trailId: number, courseIds: number[]) {
  await trailRepo.reorderCourses(trailId, courseIds);
}
