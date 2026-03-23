import * as inviteRepo from "../repositories/inviteRepository";
import * as purchaseRepo from "../repositories/purchaseRepository";
import * as workspaceRepo from "../repositories/workspaceRepository";

export async function createInvite(data: {
  workspace_id: number;
  product_id?: number;
  created_by: number;
  max_uses?: number;
  expires_at?: string;
}) {
  return await inviteRepo.create(data);
}

export async function validateInvite(code: string) {
  const invite = await inviteRepo.findByCode(code);
  if (!invite) return { valid: false, reason: "Convite nao encontrado" };
  if (invite.status !== "active") return { valid: false, reason: "Convite expirado ou revogado" };
  if (invite.max_uses && invite.used_count >= invite.max_uses) return { valid: false, reason: "Convite esgotado" };
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) return { valid: false, reason: "Convite expirado" };

  const workspace = await workspaceRepo.getById(invite.workspace_id);
  return { valid: true, invite, workspace };
}

export async function redeemInvite(code: string, userId: number): Promise<void> {
  const { valid, reason, invite } = await validateInvite(code);
  if (!valid || !invite) throw { status: 400, message: reason || "Convite invalido" };

  await inviteRepo.createRedemption(invite.id, userId);
  await inviteRepo.incrementUsage(invite.id);

  if (invite.max_uses && invite.used_count + 1 >= invite.max_uses) {
    await inviteRepo.updateStatus(invite.id, "used");
  }

  await workspaceRepo.addMember(invite.workspace_id, userId, "member");

  if (invite.product_id) {
    await purchaseRepo.create({
      user_id: userId,
      product_id: invite.product_id,
      workspace_id: invite.workspace_id,
      status: "active",
    });
  }
}

export async function getByWorkspace(workspaceId: number) {
  return await inviteRepo.findByWorkspace(workspaceId);
}

export async function revokeInvite(id: number) {
  await inviteRepo.updateStatus(id, "revoked");
}

export async function deleteInvite(id: number) {
  await inviteRepo.remove(id);
}

export async function getRedemptions(inviteCodeId: number) {
  return await inviteRepo.getRedemptions(inviteCodeId);
}
