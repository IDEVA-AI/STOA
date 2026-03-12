import * as lessonBlockRepo from "../repositories/lessonBlockRepository";

export function getByLesson(lessonId: number) {
  return lessonBlockRepo.getByLesson(lessonId);
}

export function getById(id: number) {
  return lessonBlockRepo.getById(id);
}

export function create(data: {
  lesson_id: number;
  block_type: string;
  content: object;
  position: number;
}) {
  return lessonBlockRepo.create(data);
}

export function update(
  id: number,
  data: Partial<{ block_type: string; content: object; position: number }>
) {
  return lessonBlockRepo.update(id, data);
}

export function remove(id: number) {
  return lessonBlockRepo.remove(id);
}

export function reorder(lessonId: number, blockIds: number[]) {
  return lessonBlockRepo.reorder(lessonId, blockIds);
}

export function setBlocks(
  lessonId: number,
  blocks: { block_type: string; content: object; position: number }[]
) {
  return lessonBlockRepo.setBlocks(lessonId, blocks);
}
