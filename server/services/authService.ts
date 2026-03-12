import bcrypt from "bcryptjs";
import * as userRepo from "../repositories/userRepository";
import { generateToken, generateRefreshToken, verifyRefreshToken } from "../middleware/auth";

const SALT_ROUNDS = 10;

interface AuthResult {
  user: { id: number; name: string; email: string | null; role: string | null; avatar: string | null };
  accessToken: string;
  refreshToken: string;
}

function sanitizeUser(user: userRepo.User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  };
}

export async function register(name: string, email: string, password: string): Promise<AuthResult> {
  if (!name || !email || !password) {
    throw { status: 400, message: "Name, email, and password are required" };
  }

  if (password.length < 6) {
    throw { status: 400, message: "Password must be at least 6 characters" };
  }

  const existing = userRepo.findByEmail(email);
  if (existing) {
    throw { status: 409, message: "Email already registered" };
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = userRepo.createUser(name, email, passwordHash);

  const accessToken = generateToken(user.id, user.role || undefined);
  const refreshToken = generateRefreshToken(user.id);

  return { user: sanitizeUser(user), accessToken, refreshToken };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  if (!email || !password) {
    throw { status: 400, message: "Email and password are required" };
  }

  const user = userRepo.findByEmail(email);
  if (!user || !user.password_hash) {
    throw { status: 401, message: "Invalid credentials" };
  }

  if (!user.is_active) {
    throw { status: 401, message: "Account is deactivated" };
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw { status: 401, message: "Invalid credentials" };
  }

  const accessToken = generateToken(user.id, user.role || undefined);
  const refreshToken = generateRefreshToken(user.id);

  return { user: sanitizeUser(user), accessToken, refreshToken };
}

export function refreshToken(token: string): { accessToken: string } {
  if (!token) {
    throw { status: 400, message: "Refresh token is required" };
  }

  try {
    const decoded = verifyRefreshToken(token);
    const user = userRepo.findById(decoded.userId);

    if (!user || !user.is_active) {
      throw { status: 401, message: "User not found or deactivated" };
    }

    const accessToken = generateToken(user.id, user.role || undefined);
    return { accessToken };
  } catch (err: any) {
    if (err.status) throw err;
    throw { status: 401, message: "Invalid or expired refresh token" };
  }
}

export function getMe(userId: number) {
  const user = userRepo.findById(userId);
  if (!user) {
    throw { status: 404, message: "User not found" };
  }
  return sanitizeUser(user);
}
