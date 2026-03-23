import * as adminRepo from "../repositories/adminRepository";

export async function getStats() {
  return await adminRepo.getStats();
}

export async function getRecentActivity(limit: number = 10) {
  return await adminRepo.getRecentActivity(limit);
}
