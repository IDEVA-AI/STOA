import db from "../db/connection";
import crypto from "crypto";

export interface InviteCode {
  id: number;
  code: string;
  workspace_id: number;
  product_id: number | null;
  created_by: number;
  max_uses: number | null;
  used_count: number;
  status: string;
  expires_at: string | null;
  created_at: string;
}

export interface InviteRedemption {
  id: number;
  invite_code_id: number;
  user_id: number;
  redeemed_at: string;
}

function generateCode(): string {
  return crypto.randomBytes(12).toString("base64url");
}

export async function create(data: {
  workspace_id: number;
  product_id?: number;
  created_by: number;
  max_uses?: number;
  expires_at?: string;
}): Promise<InviteCode> {
  const code = generateCode();
  const result = await db.run(
    `INSERT INTO invite_codes (code, workspace_id, product_id, created_by, max_uses, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [code, data.workspace_id, data.product_id ?? null, data.created_by, data.max_uses ?? null, data.expires_at ?? null]
  );
  return (await findById(result.rows[0].id))!;
}

export async function findByCode(code: string): Promise<InviteCode | null> {
  return (await db.get<InviteCode>("SELECT * FROM invite_codes WHERE code = $1", [code])) || null;
}

export async function findById(id: number): Promise<InviteCode | null> {
  return (await db.get<InviteCode>("SELECT * FROM invite_codes WHERE id = $1", [id])) || null;
}

export async function findByWorkspace(workspaceId: number) {
  return await db.all(
    `SELECT ic.*, u.name AS created_by_name
     FROM invite_codes ic
     JOIN users u ON u.id = ic.created_by
     WHERE ic.workspace_id = $1
     ORDER BY ic.created_at DESC`,
    [workspaceId]
  );
}

export async function incrementUsage(id: number): Promise<void> {
  await db.run("UPDATE invite_codes SET used_count = used_count + 1 WHERE id = $1", [id]);
}

export async function updateStatus(id: number, status: string): Promise<void> {
  await db.run("UPDATE invite_codes SET status = $1 WHERE id = $2", [status, id]);
}

export async function remove(id: number): Promise<void> {
  await db.run("DELETE FROM invite_codes WHERE id = $1", [id]);
}

export async function createRedemption(inviteCodeId: number, userId: number): Promise<void> {
  await db.run(
    "INSERT INTO invite_redemptions (invite_code_id, user_id) VALUES ($1, $2)",
    [inviteCodeId, userId]
  );
}

export async function getRedemptions(inviteCodeId: number) {
  return await db.all(
    `SELECT ir.*, u.name AS user_name, u.email AS user_email
     FROM invite_redemptions ir
     JOIN users u ON u.id = ir.user_id
     WHERE ir.invite_code_id = $1
     ORDER BY ir.redeemed_at DESC`,
    [inviteCodeId]
  );
}
