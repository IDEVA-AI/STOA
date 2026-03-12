import * as adminRepo from "../repositories/adminRepository";

export function getStats() {
  return adminRepo.getStats();
}

export function getRecentActivity(limit: number = 10) {
  return adminRepo.getRecentActivity(limit);
}
