import db from "../db/connection";
import { buildSetClause } from "../db/helpers";

export interface User {
  id: number;
  name: string;
  avatar: string | null;
  role: string | null;
  email: string | null;
  password_hash: string | null;
  created_at: string | null;
  is_active: number;
  bio: string | null;
  phone: string | null;
  website: string | null;
  is_public: number;
  show_progress: number;
}

export async function findByEmail(email: string): Promise<User | null> {
  return (await db.get<User>("SELECT * FROM users WHERE email = $1", [email])) || null;
}

export async function findById(id: number): Promise<User | null> {
  return (await db.get<User>("SELECT * FROM users WHERE id = $1", [id])) || null;
}

export async function createUser(
  name: string,
  email: string,
  passwordHash: string,
  role: string = "Membro",
  phone?: string
): Promise<User> {
  const result = await db.run(
    "INSERT INTO users (name, email, password_hash, role, avatar, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
    [name, email, passwordHash, role, `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`, phone ?? null]
  );

  return (await findById(Number(result.rows[0].id)))!;
}

export async function updatePassword(userId: number, newHash: string): Promise<void> {
  await db.run("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, userId]);
}

export async function updateProfile(
  userId: number,
  data: { name?: string; avatar?: string; bio?: string; website?: string; is_public?: number; show_progress?: number }
): Promise<User | null> {
  const { clause, values, nextParam } = buildSetClause(data, 1);

  if (!clause) return findById(userId);

  await db.run(`UPDATE users SET ${clause} WHERE id = $${nextParam}`, [...values, userId]);

  return findById(userId);
}
