import * as lessonTemplateRepo from "../repositories/lessonTemplateRepository";
import * as lessonBlockRepo from "../repositories/lessonBlockRepository";

export function listByWorkspace(workspaceId: number) {
  return lessonTemplateRepo.getByWorkspace(workspaceId);
}

export function getById(id: number) {
  return lessonTemplateRepo.getById(id);
}

export function create(data: {
  workspace_id: number;
  name: string;
  description?: string;
  thumbnail?: string;
  is_default?: number;
  blocks?: { block_type: string; content: object; position: number }[];
}) {
  const { blocks, ...templateData } = data;
  const result = lessonTemplateRepo.create(templateData);
  if (blocks && blocks.length > 0) {
    lessonTemplateRepo.setBlocks(result.id, blocks);
  }
  return result;
}

export function update(
  id: number,
  data: Partial<{
    name: string;
    description: string;
    thumbnail: string;
    is_default: number;
    blocks: { block_type: string; content: object; position: number }[];
  }>
) {
  const { blocks, ...templateData } = data;
  lessonTemplateRepo.update(id, templateData);
  if (blocks !== undefined) {
    lessonTemplateRepo.setBlocks(id, blocks);
  }
}

export function remove(id: number) {
  lessonTemplateRepo.remove(id);
}

export function createFromLesson(
  workspaceId: number,
  lessonId: number,
  name: string
) {
  return lessonTemplateRepo.createFromLesson(workspaceId, lessonId, name);
}

export function applyToLesson(templateId: number, lessonId: number) {
  const template = lessonTemplateRepo.getById(templateId);
  if (!template) throw new Error("Template not found");

  const blocks = template.blocks.map(
    (b: { block_type: string; content: object; position: number }) => ({
      block_type: b.block_type,
      content: b.content,
      position: b.position,
    })
  );

  lessonBlockRepo.setBlocks(lessonId, blocks);
}
