const BUNNY_API = "https://video.bunnycdn.com";
const API_KEY = process.env.BUNNY_API_KEY || "";
const LIBRARY_ID = process.env.BUNNY_LIBRARY_ID || "";
const CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME || "";

function headers(contentType = "application/json"): Record<string, string> {
  return { AccessKey: API_KEY, "Content-Type": contentType };
}

function libraryUrl(path = "") {
  return `${BUNNY_API}/library/${LIBRARY_ID}${path}`;
}

async function handleResponse(res: Response, context: string) {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Bunny API error (${context}): ${res.status} ${res.statusText} — ${body}`);
  }
  return res.json();
}

export async function createVideo(title: string) {
  const res = await fetch(libraryUrl("/videos"), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ title }),
  });
  return handleResponse(res, "createVideo");
}

export async function uploadVideo(videoId: string, buffer: Buffer) {
  const res = await fetch(libraryUrl(`/videos/${videoId}`), {
    method: "PUT",
    headers: headers("application/octet-stream"),
    body: buffer,
  });
  return handleResponse(res, "uploadVideo");
}

export async function getVideo(videoId: string) {
  const res = await fetch(libraryUrl(`/videos/${videoId}`), {
    method: "GET",
    headers: headers(),
  });
  return handleResponse(res, "getVideo");
}

export async function deleteVideo(videoId: string) {
  const res = await fetch(libraryUrl(`/videos/${videoId}`), {
    method: "DELETE",
    headers: headers(),
  });
  return handleResponse(res, "deleteVideo");
}

export function getPlayerUrl(videoId: string) {
  return `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}`;
}

export function getThumbnailUrl(videoId: string) {
  return `https://${CDN_HOSTNAME}/${videoId}/thumbnail.jpg`;
}

export function mapBunnyStatus(status: number): string {
  if (status === 3 || status === 4) return "ready";
  if (status === 5) return "failed";
  return "processing";
}
