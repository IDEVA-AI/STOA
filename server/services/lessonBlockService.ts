import * as lessonBlockRepo from "../repositories/lessonBlockRepository";

export async function getByLesson(lessonId: number) {
  return await lessonBlockRepo.getByLesson(lessonId);
}

export async function getById(id: number) {
  return await lessonBlockRepo.getById(id);
}

export async function create(data: {
  lesson_id: number;
  block_type: string;
  content: object;
  position: number;
}) {
  return await lessonBlockRepo.create(data);
}

export async function update(
  id: number,
  data: Partial<{ block_type: string; content: object; position: number }>
) {
  return await lessonBlockRepo.update(id, data);
}

export async function remove(id: number) {
  return await lessonBlockRepo.remove(id);
}

export async function reorder(lessonId: number, blockIds: number[]) {
  return await lessonBlockRepo.reorder(lessonId, blockIds);
}

export async function setBlocks(
  lessonId: number,
  blocks: { block_type: string; content: object; position: number }[]
) {
  return await lessonBlockRepo.setBlocks(lessonId, blocks);
}
