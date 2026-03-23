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

export async function listByUser(userId: number) {
  return await workspaceRepo.getByMemberId(userId);
}

export async function getBySlug(slug: string) {
  const ws = await workspaceRepo.getBySlug(slug);
  if (!ws) notFound("Workspace not found");
  return ws;
}

export async function getById(id: number) {
  const ws = await workspaceRepo.getById(id);
  if (!ws) notFound("Workspace not found");
  return ws;
}

export async function create(userId: number, data: { name: string; slug: string; logo?: string }) {
  const existing = await workspaceRepo.getBySlug(data.slug);
  if (existing) badRequest("Slug already in use");

  const id = await workspaceRepo.create({
    name: data.name,
    slug: data.slug,
    logo: data.logo,
    owner_id: userId,
  });

  await workspaceRepo.addMember(Number(id), userId, "owner");

  return await workspaceRepo.getById(Number(id));
}

export async function update(
  workspaceId: number,
  userId: number,
  data: Partial<{ name: string; slug: string; logo: string }>
) {
  const role = await workspaceRepo.isMember(workspaceId, userId);
  if (!role || (role !== "owner" && role !== "admin")) {
    forbidden("Only workspace owner or admin can update the workspace");
  }

  if (data.slug) {
    const existing = await workspaceRepo.getBySlug(data.slug) as any;
    if (existing && existing.id !== workspaceId) {
      badRequest("Slug already in use");
    }
  }

  await workspaceRepo.update(workspaceId, data);
  return await workspaceRepo.getById(workspaceId);
}

export async function remove(workspaceId: number, userId: number) {
  const role = await workspaceRepo.isMember(workspaceId, userId);
  if (role !== "owner") {
    forbidden("Only the workspace owner can delete the workspace");
  }

  await workspaceRepo.remove(workspaceId);
}

export async function getMembers(workspaceId: number) {
  return await workspaceRepo.getMembers(workspaceId);
}

export async function addMember(workspaceId: number, userId: number, role: string = "member") {
  await workspaceRepo.addMember(workspaceId, userId, role);
  return await workspaceRepo.getMembers(workspaceId);
}

export async function updateMemberRole(
  workspaceId: number,
  targetUserId: number,
  role: string,
  requesterId: number
) {
  const requesterRole = await workspaceRepo.isMember(workspaceId, requesterId);
  if (!requesterRole || (requesterRole !== "owner" && requesterRole !== "admin")) {
    forbidden("Only workspace owner or admin can change member roles");
  }

  const targetRole = await workspaceRepo.isMember(workspaceId, targetUserId);
  if (!targetRole) notFound("Member not found in workspace");

  if (targetRole === "owner") {
    forbidden("Cannot change the owner's role");
  }

  await workspaceRepo.updateMemberRole(workspaceId, targetUserId, role);
  return await workspaceRepo.getMembers(workspaceId);
}

export async function removeMember(
  workspaceId: number,
  targetUserId: number,
  requesterId: number
) {
  const requesterRole = await workspaceRepo.isMember(workspaceId, requesterId);
  if (!requesterRole || (requesterRole !== "owner" && requesterRole !== "admin")) {
    forbidden("Only workspace owner or admin can remove members");
  }

  const targetRole = await workspaceRepo.isMember(workspaceId, targetUserId);
  if (!targetRole) notFound("Member not found in workspace");

  if (targetRole === "owner") {
    forbidden("Cannot remove the workspace owner");
  }

  await workspaceRepo.removeMember(workspaceId, targetUserId);
  return await workspaceRepo.getMembers(workspaceId);
}
