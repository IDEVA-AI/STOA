import crypto from "crypto";
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DB_PATH
  ? path.dirname(process.env.DB_PATH)
  : process.cwd();
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

// Ensure upload directories exist
for (const sub of ["images", "videos", "files"]) {
  const dir = path.join(UPLOADS_DIR, sub);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getUploadsDir(): string {
  return UPLOADS_DIR;
}

/**
 * Generate a unique filename: {base}-{timestamp}-{random8hex}.{ext}
 */
export function uniqueFilename(originalName: string): string {
  const ext = originalName.includes(".")
    ? originalName.slice(originalName.lastIndexOf("."))
    : "";
  const base = originalName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 64);
  const suffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  return `${base}-${suffix}${ext}`;
}

/**
 * Save a file buffer to local disk.
 * Returns the public URL path (e.g. /uploads/images/foto-123.jpg)
 */
export function saveToLocal(
  file: Buffer,
  filename: string,
  folder: string
): string {
  const dir = path.join(UPLOADS_DIR, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, file);
  return `/uploads/${folder}/${filename}`;
}

/**
 * Delete a file from local disk.
 */
export function deleteLocal(filePath: string): void {
  const fullPath = path.join(UPLOADS_DIR, filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

/**
 * List files from a local upload folder.
 */
export function listLocalFiles(
  folder: string
): Array<{ name: string; url: string; size: number; lastChanged: string }> {
  const dir = path.join(UPLOADS_DIR, folder);
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir);
  return entries
    .map((name) => {
      const filePath = path.join(dir, name);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) return null;
      return {
        name,
        url: `/uploads/${folder}/${name}`,
        size: stat.size,
        lastChanged: stat.mtime.toISOString(),
      };
    })
    .filter(Boolean) as Array<{ name: string; url: string; size: number; lastChanged: string }>;
}
