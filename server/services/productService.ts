import * as productRepo from "../repositories/productRepository";

export async function listByWorkspace(workspaceId: number) {
  return await productRepo.getByWorkspace(workspaceId);
}

export async function getById(id: number) {
  return await productRepo.getById(id);
}

export async function create(data: {
  workspace_id: number;
  title: string;
  description?: string;
  price?: number;
  type?: string;
  is_published?: number;
  courseIds?: number[];
}) {
  const { courseIds, ...productData } = data;
  const id = await productRepo.create(productData);

  if (courseIds && courseIds.length > 0) {
    await productRepo.setCourses(id, courseIds);
  }

  return id;
}

export async function update(
  id: number,
  data: Partial<{
    title: string;
    description: string;
    price: number;
    type: string;
    is_published: number;
    courseIds: number[];
  }>
) {
  const { courseIds, ...productData } = data;
  await productRepo.update(id, productData);

  if (courseIds !== undefined) {
    await productRepo.setCourses(id, courseIds);
  }
}

export async function remove(id: number) {
  await productRepo.remove(id);
}

export async function getCourses(productId: number) {
  return await productRepo.getCourses(productId);
}

export async function setCourses(productId: number, courseIds: number[]) {
  await productRepo.setCourses(productId, courseIds);
}
