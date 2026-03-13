import db from "../db/connection";

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
}

export function findByEmail(email: string): User | null {
  return (db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User) || null;
}

export function findById(id: number): User | null {
  return (db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User) || null;
}

export function createUser(
  name: string,
  email: string,
  passwordHash: string,
  role: string = "Membro",
  phone?: string
): User {
  const result = db
    .prepare(
      "INSERT INTO users (name, email, password_hash, role, avatar, phone) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(name, email, passwordHash, role, `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`, phone ?? null);

  return findById(Number(result.lastInsertRowid))!;
}

export function updatePassword(userId: number, newHash: string): void {
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(newHash, userId);
}

export function updateProfile(
  userId: number,
  data: { name?: string; avatar?: string; bio?: string }
): User | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.avatar !== undefined) {
    fields.push("avatar = ?");
    values.push(data.avatar);
  }
  if (data.bio !== undefined) {
    fields.push("bio = ?");
    values.push(data.bio);
  }

  if (fields.length === 0) return findById(userId);

  values.push(userId);
  db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  return findById(userId);
}
