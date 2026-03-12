import * as announcementRepo from "../repositories/announcementRepository";

export function getAll() {
  return announcementRepo.getAll();
}

export function getById(id: number) {
  return announcementRepo.getById(id);
}

export function create(data: {
  title: string;
  type?: string;
  priority?: number;
  frequency?: string;
  target?: string;
  is_active?: number;
  expires_at?: string | null;
  blocks?: { block_type: string; content: string; order: number }[];
}) {
  return announcementRepo.create(data);
}

export function update(
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
  return announcementRepo.update(id, data);
}

export function remove(id: number) {
  return announcementRepo.remove(id);
}

export function getPendingForUser(userId: number) {
  return announcementRepo.getPendingForUser(userId);
}

export function confirm(announcementId: number, userId: number) {
  return announcementRepo.confirm(announcementId, userId);
}
