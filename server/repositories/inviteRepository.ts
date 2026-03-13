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

export function create(data: {
  workspace_id: number;
  product_id?: number;
  created_by: number;
  max_uses?: number;
  expires_at?: string;
}): InviteCode {
  const code = generateCode();
  const result = db
    .prepare(
      `INSERT INTO invite_codes (code, workspace_id, product_id, created_by, max_uses, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(code, data.workspace_id, data.product_id ?? null, data.created_by, data.max_uses ?? null, data.expires_at ?? null);
  return findById(Number(result.lastInsertRowid))!;
}

export function findByCode(code: string): InviteCode | null {
  return (db.prepare("SELECT * FROM invite_codes WHERE code = ?").get(code) as InviteCode) || null;
}

export function findById(id: number): InviteCode | null {
  return (db.prepare("SELECT * FROM invite_codes WHERE id = ?").get(id) as InviteCode) || null;
}

export function findByWorkspace(workspaceId: number) {
  return db
    .prepare(
      `SELECT ic.*, u.name AS created_by_name
       FROM invite_codes ic
       JOIN users u ON u.id = ic.created_by
       WHERE ic.workspace_id = ?
       ORDER BY ic.created_at DESC`
    )
    .all(workspaceId);
}

export function incrementUsage(id: number): void {
  db.prepare("UPDATE invite_codes SET used_count = used_count + 1 WHERE id = ?").run(id);
}

export function updateStatus(id: number, status: string): void {
  db.prepare("UPDATE invite_codes SET status = ? WHERE id = ?").run(status, id);
}

export function remove(id: number): void {
  db.prepare("DELETE FROM invite_codes WHERE id = ?").run(id);
}

export function createRedemption(inviteCodeId: number, userId: number): void {
  db.prepare(
    "INSERT INTO invite_redemptions (invite_code_id, user_id) VALUES (?, ?)"
  ).run(inviteCodeId, userId);
}

export function getRedemptions(inviteCodeId: number) {
  return db
    .prepare(
      `SELECT ir.*, u.name AS user_name, u.email AS user_email
       FROM invite_redemptions ir
       JOIN users u ON u.id = ir.user_id
       WHERE ir.invite_code_id = ?
       ORDER BY ir.redeemed_at DESC`
    )
    .all(inviteCodeId);
}
