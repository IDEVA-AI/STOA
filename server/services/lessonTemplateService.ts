import * as lessonTemplateRepo from "../repositories/lessonTemplateRepository";
import * as lessonBlockRepo from "../repositories/lessonBlockRepository";

export async function listByWorkspace(workspaceId: number) {
  return await lessonTemplateRepo.getByWorkspace(workspaceId);
}

export async function getById(id: number) {
  return await lessonTemplateRepo.getById(id);
}

export async function create(data: {
  workspace_id: number;
  name: string;
  description?: string;
  thumbnail?: string;
  is_default?: number;
  blocks?: { block_type: string; content: object; position: number }[];
}) {
  const { blocks, ...templateData } = data;
  const result = await lessonTemplateRepo.create(templateData);
  if (blocks && blocks.length > 0) {
    await lessonTemplateRepo.setBlocks(result.id, blocks);
  }
  return result;
}

export async function update(
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
  await lessonTemplateRepo.update(id, templateData);
  if (blocks !== undefined) {
    await lessonTemplateRepo.setBlocks(id, blocks);
  }
}

export async function remove(id: number) {
  await lessonTemplateRepo.remove(id);
}

export async function createFromLesson(
  workspaceId: number,
  lessonId: number,
  name: string
) {
  return await lessonTemplateRepo.createFromLesson(workspaceId, lessonId, name);
}

export async function applyToLesson(templateId: number, lessonId: number) {
  const template = await lessonTemplateRepo.getById(templateId);
  if (!template) throw new Error("Template not found");

  const blocks = template.blocks.map(
    (b: { block_type: string; content: object; position: number }) => ({
      block_type: b.block_type,
      content: b.content,
      position: b.position,
    })
  );

  await lessonBlockRepo.setBlocks(lessonId, blocks);
}
