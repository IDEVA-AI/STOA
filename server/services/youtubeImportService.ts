import { spawn } from "child_process";
import { readFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import * as bunnyService from "./bunnyService";
import db from "../db/connection";
import { broadcastToAll } from "../ws";

export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/.test(url);
}

export function extractVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

interface ImportJob {
  blockId: number;
  youtubeUrl: string;
  videoId: string;
}

function broadcast(
  blockId: number,
  status: string,
  progress?: number,
  extra?: Record<string, unknown>
) {
  broadcastToAll({ type: "video_import", blockId, status, progress, ...extra });
}

async function updateBlockContent(blockId: number, fields: Record<string, unknown>) {
  const row = await db.get<{ content: any }>(
    "SELECT content FROM lesson_blocks WHERE id = $1",
    [blockId]
  );
  if (!row) return;
  const content = typeof row.content === "string" ? JSON.parse(row.content) : row.content;
  const updated = { ...content, ...fields };
  await db.run("UPDATE lesson_blocks SET content = $1 WHERE id = $2", [
    JSON.stringify(updated),
    blockId,
  ]);
}

function downloadWithProgress(
  blockId: number,
  videoId: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "-f",
      "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best",
      "--merge-output-format",
      "mp4",
      "--newline",
      "-o",
      outputPath,
      `https://www.youtube.com/watch?v=${videoId}`,
    ];

    const proc = spawn("yt-dlp", args);

    let lastReportedProgress = -1;

    function parseLine(line: string) {
      const match = line.match(/\[download\]\s+([\d.]+)%/);
      if (!match) return;
      const ytPercent = parseFloat(match[1]);
      const totalProgress = Math.floor(ytPercent * 0.6);
      if (totalProgress - lastReportedProgress >= 5) {
        lastReportedProgress = totalProgress;
        broadcast(blockId, "downloading", totalProgress);
        updateBlockContent(blockId, { import_progress: totalProgress }).catch(() => {});
      }
    }

    proc.stdout.on("data", (chunk: Buffer) => {
      chunk.toString().split("\n").forEach(parseLine);
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      chunk.toString().split("\n").forEach(parseLine);
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`yt-dlp spawn error: ${err.message}`));
    });
  });
}

export async function importVideo(job: ImportJob): Promise<void> {
  const tmpFile = path.join(os.tmpdir(), `stoa-import-${job.blockId}-${job.videoId}.mp4`);

  try {
    await updateBlockContent(job.blockId, {
      import_status: "importing",
      youtube_url: job.youtubeUrl,
      import_progress: 0,
      import_error: null,
    });
    broadcast(job.blockId, "downloading", 0);

    await downloadWithProgress(job.blockId, job.videoId, tmpFile);

    broadcast(job.blockId, "uploading", 65);

    const buffer = await readFile(tmpFile);

    const title = `youtube-import-${job.videoId}`;
    const video = await bunnyService.createVideo(title);
    const guid: string = video.guid;

    await bunnyService.uploadVideo(guid, buffer);

    broadcast(job.blockId, "uploading", 95);

    const bunnyUrl = bunnyService.getPlayerUrl(guid);

    await updateBlockContent(job.blockId, {
      url: bunnyUrl,
      import_status: "completed",
      import_progress: 100,
      bunny_video_id: guid,
    });

    broadcast(job.blockId, "completed", 100, { bunnyUrl });

    console.log(`[youtubeImportService] Block ${job.blockId} imported successfully (guid=${guid})`);
  } catch (err: any) {
    const message = err?.message ?? "Unknown error";
    await updateBlockContent(job.blockId, {
      import_status: "error",
      import_error: message,
    }).catch(() => {});
    broadcast(job.blockId, "error", undefined, { error: message });
  } finally {
    await unlink(tmpFile).catch(() => {});
  }
}

export async function cleanupStaleImports(): Promise<void> {
  const stale = await db.all<{ id: number; content: any }>(
    "SELECT id, content FROM lesson_blocks WHERE block_type = 'video' AND content::text LIKE '%importing%'"
  );

  for (const row of stale) {
    try {
      const content = typeof row.content === "string" ? JSON.parse(row.content) : row.content;
      if (content?.import_status !== "importing") continue;
      const updated = {
        ...content,
        import_status: "error",
        import_error: "Import interrupted by server restart",
      };
      await db.run("UPDATE lesson_blocks SET content = $1 WHERE id = $2", [
        JSON.stringify(updated),
        row.id,
      ]);
    } catch {
      // skip blocks with unparseable content
    }
  }
}
