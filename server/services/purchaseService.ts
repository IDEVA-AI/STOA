import * as purchaseRepo from "../repositories/purchaseRepository";
import * as productRepo from "../repositories/productRepository";

export function listByUser(userId: number) {
  return purchaseRepo.getByUser(userId);
}

export function listByWorkspace(workspaceId: number) {
  return purchaseRepo.getByWorkspace(workspaceId);
}

export function create(data: {
  user_id: number;
  product_id: number;
  workspace_id: number;
  status?: string;
  expires_at?: string | null;
}) {
  const product = productRepo.getById(data.product_id) as any;
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

  const id = purchaseRepo.create(data);
  return id;
}

export function updateStatus(id: number, status: string) {
  purchaseRepo.updateStatus(id, status);
}

export function hasAccess(userId: number, courseId: number): boolean {
  return purchaseRepo.hasAccess(userId, courseId);
}

export function getUserCourseIds(userId: number): number[] {
  return purchaseRepo.getUserCourseIds(userId);
}
