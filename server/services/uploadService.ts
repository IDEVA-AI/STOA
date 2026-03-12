import "dotenv/config";
import crypto from "crypto";

const BUNNY_API_KEY = process.env.BUNNY_API_KEY || "";
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME || "";
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID || "";

const STORAGE_BASE = `https://storage.bunnycdn.com/${BUNNY_LIBRARY_ID}`;

/**
 * Generate a unique filename: {timestamp}-{random8hex}.{ext}
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
 * Upload a file buffer to Bunny CDN storage.
 * Returns the public CDN URL.
 */
export async function uploadToBunny(
  file: Buffer,
  filename: string,
  folder: string
): Promise<string> {
  const url = `${STORAGE_BASE}/${folder}/${filename}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      AccessKey: BUNNY_API_KEY,
      "Content-Type": "application/octet-stream",
    },
    body: file,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Bunny upload failed (${res.status}): ${text}`);
  }

  return `https://${BUNNY_CDN_HOSTNAME}/${folder}/${filename}`;
}

/**
 * Delete a file from Bunny CDN storage.
 * @param path - e.g. "uploads/myfile-123.jpg"
 */
/**
 * List files from a Bunny CDN storage folder.
 */
export async function listBunnyFiles(
  folder: string
): Promise<Array<{ name: string; url: string; size: number; lastChanged: string }>> {
  const url = `${STORAGE_BASE}/${folder}/`;

  const res = await fetch(url, {
    method: "GET",
    headers: { AccessKey: BUNNY_API_KEY, Accept: "application/json" },
  });

  if (!res.ok) {
    if (res.status === 404) return [];
    const text = await res.text().catch(() => "");
    throw new Error(`Bunny list failed (${res.status}): ${text}`);
  }

  const items = (await res.json()) as Array<{
    ObjectName: string;
    Length: number;
    LastChanged: string;
    IsDirectory: boolean;
  }>;

  return items
    .filter((i) => !i.IsDirectory)
    .map((i) => ({
      name: i.ObjectName,
      url: `https://${BUNNY_CDN_HOSTNAME}/${folder}/${i.ObjectName}`,
      size: i.Length,
      lastChanged: i.LastChanged,
    }))
    .sort((a, b) => new Date(b.lastChanged).getTime() - new Date(a.lastChanged).getTime());
}

export async function deleteFromBunny(path: string): Promise<void> {
  const url = `${STORAGE_BASE}/${path}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      AccessKey: BUNNY_API_KEY,
    },
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => "");
    throw new Error(`Bunny delete failed (${res.status}): ${text}`);
  }
}
