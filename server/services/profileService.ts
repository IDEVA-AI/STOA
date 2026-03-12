import bcrypt from "bcryptjs";
import * as userRepo from "../repositories/userRepository";

const SALT_ROUNDS = 10;

function sanitizeUser(user: userRepo.User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
  };
}

export function getProfile(userId: number) {
  const user = userRepo.findById(userId);
  if (!user) {
    throw { status: 404, message: "User not found" };
  }
  return sanitizeUser(user);
}

export function updateProfile(
  userId: number,
  data: { name?: string; avatar?: string; bio?: string }
) {
  const user = userRepo.findById(userId);
  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const updated = userRepo.updateProfile(userId, data);
  if (!updated) {
    throw { status: 500, message: "Failed to update profile" };
  }

  return sanitizeUser(updated);
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
) {
  if (!currentPassword || !newPassword) {
    throw { status: 400, message: "Current password and new password are required" };
  }

  if (newPassword.length < 6) {
    throw { status: 400, message: "New password must be at least 6 characters" };
  }

  const user = userRepo.findById(userId);
  if (!user || !user.password_hash) {
    throw { status: 404, message: "User not found" };
  }

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) {
    throw { status: 401, message: "Current password is incorrect" };
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  userRepo.updatePassword(userId, newHash);

  return { message: "Password updated successfully" };
}
