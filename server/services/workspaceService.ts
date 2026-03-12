import * as workspaceRepo from "../repositories/workspaceRepository";

function forbidden(message: string): never {
  const err = new Error(message) as any;
  err.status = 403;
  throw err;
}

function notFound(message: string): never {
  const err = new Error(message) as any;
  err.status = 404;
  throw err;
}

function badRequest(message: string): never {
  const err = new Error(message) as any;
  err.status = 400;
  throw err;
}

export function listByUser(userId: number) {
  return workspaceRepo.getByMemberId(userId);
}

export function getBySlug(slug: string) {
  const ws = workspaceRepo.getBySlug(slug);
  if (!ws) notFound("Workspace not found");
  return ws;
}

export function getById(id: number) {
  const ws = workspaceRepo.getById(id);
  if (!ws) notFound("Workspace not found");
  return ws;
}

export function create(userId: number, data: { name: string; slug: string; logo?: string }) {
  const existing = workspaceRepo.getBySlug(data.slug);
  if (existing) badRequest("Slug already in use");

  const id = workspaceRepo.create({
    name: data.name,
    slug: data.slug,
    logo: data.logo,
    owner_id: userId,
  });

  workspaceRepo.addMember(Number(id), userId, "owner");

  return workspaceRepo.getById(Number(id));
}

export function update(
  workspaceId: number,
  userId: number,
  data: Partial<{ name: string; slug: string; logo: string }>
) {
  const role = workspaceRepo.isMember(workspaceId, userId);
  if (!role || (role !== "owner" && role !== "admin")) {
    forbidden("Only workspace owner or admin can update the workspace");
  }

  if (data.slug) {
    const existing = workspaceRepo.getBySlug(data.slug) as any;
    if (existing && existing.id !== workspaceId) {
      badRequest("Slug already in use");
    }
  }

  workspaceRepo.update(workspaceId, data);
  return workspaceRepo.getById(workspaceId);
}

export function remove(workspaceId: number, userId: number) {
  const role = workspaceRepo.isMember(workspaceId, userId);
  if (role !== "owner") {
    forbidden("Only the workspace owner can delete the workspace");
  }

  workspaceRepo.remove(workspaceId);
}

export function getMembers(workspaceId: number) {
  return workspaceRepo.getMembers(workspaceId);
}

export function addMember(workspaceId: number, userId: number, role: string = "member") {
  workspaceRepo.addMember(workspaceId, userId, role);
  return workspaceRepo.getMembers(workspaceId);
}

export function updateMemberRole(
  workspaceId: number,
  targetUserId: number,
  role: string,
  requesterId: number
) {
  const requesterRole = workspaceRepo.isMember(workspaceId, requesterId);
  if (!requesterRole || (requesterRole !== "owner" && requesterRole !== "admin")) {
    forbidden("Only workspace owner or admin can change member roles");
  }

  const targetRole = workspaceRepo.isMember(workspaceId, targetUserId);
  if (!targetRole) notFound("Member not found in workspace");

  if (targetRole === "owner") {
    forbidden("Cannot change the owner's role");
  }

  workspaceRepo.updateMemberRole(workspaceId, targetUserId, role);
  return workspaceRepo.getMembers(workspaceId);
}

export function removeMember(
  workspaceId: number,
  targetUserId: number,
  requesterId: number
) {
  const requesterRole = workspaceRepo.isMember(workspaceId, requesterId);
  if (!requesterRole || (requesterRole !== "owner" && requesterRole !== "admin")) {
    forbidden("Only workspace owner or admin can remove members");
  }

  const targetRole = workspaceRepo.isMember(workspaceId, targetUserId);
  if (!targetRole) notFound("Member not found in workspace");

  if (targetRole === "owner") {
    forbidden("Cannot remove the workspace owner");
  }

  workspaceRepo.removeMember(workspaceId, targetUserId);
  return workspaceRepo.getMembers(workspaceId);
}
