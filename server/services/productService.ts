import * as productRepo from "../repositories/productRepository";

export function listByWorkspace(workspaceId: number) {
  return productRepo.getByWorkspace(workspaceId);
}

export function getById(id: number) {
  return productRepo.getById(id);
}

export function create(data: {
  workspace_id: number;
  title: string;
  description?: string;
  price?: number;
  type?: string;
  is_published?: number;
  courseIds?: number[];
}) {
  const { courseIds, ...productData } = data;
  const id = productRepo.create(productData);

  if (courseIds && courseIds.length > 0) {
    productRepo.setCourses(id, courseIds);
  }

  return id;
}

export function update(
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
  productRepo.update(id, productData);

  if (courseIds !== undefined) {
    productRepo.setCourses(id, courseIds);
  }
}

export function remove(id: number) {
  productRepo.remove(id);
}

export function getCourses(productId: number) {
  return productRepo.getCourses(productId);
}

export function setCourses(productId: number, courseIds: number[]) {
  productRepo.setCourses(productId, courseIds);
}
