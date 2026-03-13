import * as inviteRepo from "../repositories/inviteRepository";
import * as purchaseRepo from "../repositories/purchaseRepository";
import * as workspaceRepo from "../repositories/workspaceRepository";

export function createInvite(data: {
  workspace_id: number;
  product_id?: number;
  created_by: number;
  max_uses?: number;
  expires_at?: string;
}) {
  return inviteRepo.create(data);
}

export function validateInvite(code: string) {
  const invite = inviteRepo.findByCode(code);
  if (!invite) return { valid: false, reason: "Convite nao encontrado" };
  if (invite.status !== "active") return { valid: false, reason: "Convite expirado ou revogado" };
  if (invite.max_uses && invite.used_count >= invite.max_uses) return { valid: false, reason: "Convite esgotado" };
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) return { valid: false, reason: "Convite expirado" };

  const workspace = workspaceRepo.getById(invite.workspace_id);
  return { valid: true, invite, workspace };
}

export function redeemInvite(code: string, userId: number): void {
  const { valid, reason, invite } = validateInvite(code);
  if (!valid || !invite) throw { status: 400, message: reason || "Convite invalido" };

  inviteRepo.createRedemption(invite.id, userId);
  inviteRepo.incrementUsage(invite.id);

  if (invite.max_uses && invite.used_count + 1 >= invite.max_uses) {
    inviteRepo.updateStatus(invite.id, "used");
  }

  workspaceRepo.addMember(invite.workspace_id, userId, "member");

  if (invite.product_id) {
    purchaseRepo.create({
      user_id: userId,
      product_id: invite.product_id,
      workspace_id: invite.workspace_id,
      status: "active",
    });
  }
}

export function getByWorkspace(workspaceId: number) {
  return inviteRepo.findByWorkspace(workspaceId);
}

export function revokeInvite(id: number) {
  inviteRepo.updateStatus(id, "revoked");
}

export function deleteInvite(id: number) {
  inviteRepo.remove(id);
}

export function getRedemptions(inviteCodeId: number) {
  return inviteRepo.getRedemptions(inviteCodeId);
}
