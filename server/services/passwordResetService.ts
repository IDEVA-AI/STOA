import crypto from "crypto";
import bcrypt from "bcryptjs";
import db from "../db/connection";
import * as userRepo from "../repositories/userRepository";

const TOKEN_EXPIRY_HOURS = 1;
const SALT_ROUNDS = 10;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function generateResetToken(userId: number, createdBy: number): Promise<string> {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw { status: 404, message: "Usuario nao encontrado" };
  }

  // Invalidate any existing unused tokens for this user
  await db.run(
    "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL",
    [userId]
  );

  // Generate random token and store SHA-256 hash
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  await db.run(
    "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_by) VALUES ($1, $2, $3, $4)",
    [userId, tokenHash, expiresAt, createdBy]
  );

  return token;
}

export async function redeemResetToken(token: string, newPassword: string): Promise<void> {
  if (!token || !newPassword) {
    throw { status: 400, message: "Token e nova senha sao obrigatorios" };
  }

  if (newPassword.length < 6) {
    throw { status: 400, message: "Senha deve ter pelo menos 6 caracteres" };
  }

  // Direct lookup by SHA-256 hash (O(1) instead of scanning)
  const tokenHash = hashToken(token);
  const row = await db.get<{ id: number; user_id: number }>(
    "SELECT id, user_id FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()",
    [tokenHash]
  );

  if (!row) {
    throw { status: 400, message: "Token invalido ou expirado" };
  }

  // Update password
  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await userRepo.updatePassword(row.user_id, newHash);

  // Mark token as used
  await db.run("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1", [row.id]);
}
