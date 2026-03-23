import * as announcementRepo from "../repositories/announcementRepository";

export async function getAll() {
  return await announcementRepo.getAll();
}

export async function getById(id: number) {
  return await announcementRepo.getById(id);
}

export async function create(data: {
  title: string;
  type?: string;
  priority?: number;
  frequency?: string;
  target?: string;
  is_active?: number;
  expires_at?: string | null;
  blocks?: { block_type: string; content: string; order: number }[];
}) {
  return await announcementRepo.create(data);
}

export async function update(
  id: number,
  data: {
    title: string;
    type?: string;
    priority?: number;
    frequency?: string;
    target?: string;
    is_active?: number;
    expires_at?: string | null;
    blocks?: { block_type: string; content: string; order: number }[];
  }
) {
  return await announcementRepo.update(id, data);
}

export async function remove(id: number) {
  return await announcementRepo.remove(id);
}

export async function getPendingForUser(userId: number) {
  return await announcementRepo.getPendingForUser(userId);
}

export async function confirm(announcementId: number, userId: number) {
  return await announcementRepo.confirm(announcementId, userId);
}
