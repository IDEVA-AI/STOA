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
  role: string = "Membro"
): User {
  const result = db
    .prepare(
      "INSERT INTO users (name, email, password_hash, role, avatar) VALUES (?, ?, ?, ?, ?)"
    )
    .run(name, email, passwordHash, role, `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`);

  return findById(Number(result.lastInsertRowid))!;
}

export function updatePassword(userId: number, newHash: string): void {
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(newHash, userId);
}
