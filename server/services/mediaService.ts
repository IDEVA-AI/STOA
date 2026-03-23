import * as mediaRepo from "../repositories/mediaRepository";
import * as bunnyService from "./bunnyService";
import { saveToLocal, deleteLocal, uniqueFilename } from "./uploadService";

export async function uploadMedia(
  file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  workspaceId: number,
  userId: number
) {
  const fileType = file.mimetype.startsWith("image/")
    ? "image"
    : file.mimetype.startsWith("video/")
      ? "video"
      : "document";

  const folder = fileType === "image" ? "images" : fileType === "video" ? "videos" : "files";
  const name = file.originalname.replace(/\.[^.]+$/, "");

  if (fileType === "video") {
    const video = await bunnyService.createVideo(name);
    await bunnyService.uploadVideo(video.guid, file.buffer);
    const url = bunnyService.getPlayerUrl(video.guid);

    return mediaRepo.create({
      workspace_id: workspaceId,
      uploaded_by: userId,
      name,
      original_filename: file.originalname,
      mime_type: file.mimetype,
      file_type: "video",
      url,
      size: file.size,
      bunny_video_id: video.guid,
      bunny_status: "processing",
      source: "bunny",
    });
  }

  const filename = uniqueFilename(file.originalname);
  const url = saveToLocal(file.buffer, filename, folder);

  return mediaRepo.create({
    workspace_id: workspaceId,
    uploaded_by: userId,
    name,
    original_filename: file.originalname,
    mime_type: file.mimetype,
    file_type: fileType,
    file_path: `${folder}/${filename}`,
    url,
    size: file.size,
    source: "local",
  });
}

export async function listMedia(
  workspaceId: number,
  filters: { type?: string; search?: string; tags?: string; archived?: number; page?: number; limit?: number }
) {
  return mediaRepo.list(workspaceId, filters);
}

export async function getMedia(id: number) {
  const asset = await mediaRepo.findById(id);
  if (!asset) throw new Error("Midia nao encontrada");
  return asset;
}

export async function updateMedia(
  id: number,
  data: { name?: string; description?: string; tags?: string }
) {
  return mediaRepo.update(id, data);
}

export async function deleteMedia(id: number) {
  return mediaRepo.archive(id);
}

export async function permanentDelete(id: number) {
  const asset = await mediaRepo.findById(id);
  if (!asset) throw new Error("Midia nao encontrada");

  if (asset.source === "bunny" && asset.bunny_video_id) {
    await bunnyService.deleteVideo(asset.bunny_video_id);
  }

  if (asset.source === "local" && asset.file_path) {
    deleteLocal(asset.file_path);
  }

  await mediaRepo.hardDelete(id);
}

export async function restoreMedia(id: number) {
  return mediaRepo.restore(id);
}

export async function getStorageStats(workspaceId: number) {
  return mediaRepo.getStorageStats(workspaceId);
}

export async function syncBunnyStatus(id: number) {
  const asset = await getMedia(id);
  if (asset.source !== "bunny" || !asset.bunny_video_id) {
    throw new Error("Asset is not a Bunny video");
  }

  const video = await bunnyService.getVideo(asset.bunny_video_id);
  const bunny_status = bunnyService.mapBunnyStatus(video.status);

  return mediaRepo.update(id, {
    bunny_status,
    duration: video.length || null,
    url: bunnyService.getPlayerUrl(asset.bunny_video_id),
  });
}
