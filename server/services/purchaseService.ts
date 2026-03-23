import * as purchaseRepo from "../repositories/purchaseRepository";
import * as productRepo from "../repositories/productRepository";

export async function listByUser(userId: number) {
  return await purchaseRepo.getByUser(userId);
}

export async function listByWorkspace(workspaceId: number) {
  return await purchaseRepo.getByWorkspace(workspaceId);
}

export async function create(data: {
  user_id: number;
  product_id: number;
  workspace_id: number;
  status?: string;
  expires_at?: string | null;
}) {
  const product = await productRepo.getById(data.product_id) as any;
  if (!product) {
    const err: any = new Error("Product not found");
    err.status = 404;
    throw err;
  }
  if (!product.is_published) {
    const err: any = new Error("Product is not published");
    err.status = 400;
    throw err;
  }

  const id = await purchaseRepo.create(data);
  return id;
}

export async function updateStatus(id: number, status: string) {
  await purchaseRepo.updateStatus(id, status);
}

export async function hasAccess(userId: number, courseId: number): Promise<boolean> {
  return await purchaseRepo.hasAccess(userId, courseId);
}

export async function getUserCourseIds(userId: number): Promise<number[]> {
  return await purchaseRepo.getUserCourseIds(userId);
}
