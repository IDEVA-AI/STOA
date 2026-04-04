# YouTube Auto-Import to Bunny.net — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically import YouTube videos to Bunny.net CDN when an admin saves a video block with a YouTube URL.

**Architecture:** Hook into lesson block save routes to detect YouTube URLs, spawn async yt-dlp download + Bunny upload, broadcast progress via existing WebSocket, update block URL to Bunny CDN when done.

**Tech Stack:** Express, PostgreSQL, yt-dlp (CLI), Bunny.net Stream API, WebSocket (ws), React 19, Tailwind CSS v4

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `server/services/youtubeImportService.ts` | Orchestrates download → upload → DB update → WS broadcast |
| Modify | `server/routes/lessonBlocks.ts` | Detect YouTube URLs on save, trigger import |
| Modify | `server/ws.ts` | Export `broadcastToAll()` for import progress |
| Modify | `src/components/blocks/VideoPlayer.tsx` | Show import progress overlay, listen to WS |
| Modify | `src/components/blocks/BlockRenderer.tsx` | Pass blockId + import fields to VideoPlayer |
| Modify | `Dockerfile` | Add yt-dlp + ffmpeg |

---

### Task 1: Add yt-dlp to Dockerfile

**Files:**
- Modify: `Dockerfile`

- [ ] **Step 1: Add yt-dlp and ffmpeg to production stage**

In `Dockerfile`, replace the production stage:

```dockerfile
# Stage 2: Production server
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server/ server/
COPY tsconfig.json ./
COPY --from=builder /app/dist/ dist/
ENV NODE_ENV=production
EXPOSE 4747
CMD ["npx", "tsx", "server/index.ts"]
```

With:

```dockerfile
# Stage 2: Production server
FROM node:20-alpine
RUN apk add --no-cache python3 py3-pip ffmpeg && \
    pip3 install --break-system-packages yt-dlp
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server/ server/
COPY tsconfig.json ./
COPY --from=builder /app/dist/ dist/
ENV NODE_ENV=production
EXPOSE 4747
CMD ["npx", "tsx", "server/index.ts"]
```

- [ ] **Step 2: Commit**

```bash
git add Dockerfile
git commit -m "chore: add yt-dlp and ffmpeg to Docker image"
```

---

### Task 2: Add broadcastToAll to WebSocket

**Files:**
- Modify: `server/ws.ts`

- [ ] **Step 1: Add broadcastToAll function**

After the existing `broadcastToUser` function in `server/ws.ts`, add:

```typescript
export function broadcastToAll(data: unknown) {
  const payload = JSON.stringify(data);
  for (const sockets of clients.values()) {
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/ws.ts
git commit -m "feat(ws): add broadcastToAll for import progress"
```

---

### Task 3: Create youtubeImportService

**Files:**
- Create: `server/services/youtubeImportService.ts`

- [ ] **Step 1: Create the service file**

Create `server/services/youtubeImportService.ts`:

```typescript
import { spawn } from "child_process";
import { readFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import * as bunnyService from "./bunnyService";
import db from "../db/connection";
import { broadcastToAll } from "../ws";

const YT_URL_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function isYouTubeUrl(url: string): boolean {
  return YT_URL_REGEX.test(url);
}

export function extractVideoId(url: string): string | null {
  const match = url.match(YT_URL_REGEX);
  return match ? match[1] : null;
}

interface ImportJob {
  blockId: number;
  youtubeUrl: string;
  videoId: string;
}

function broadcast(blockId: number, status: string, progress?: number, extra?: Record<string, unknown>) {
  broadcastToAll({
    type: "video_import",
    blockId,
    status,
    progress: progress ?? 0,
    ...extra,
  });
}

async function updateBlockContent(blockId: number, fields: Record<string, unknown>) {
  const row = await db.get<{ content: any }>("SELECT content FROM lesson_blocks WHERE id = $1", [blockId]);
  if (!row) return;
  const content = typeof row.content === "string" ? JSON.parse(row.content) : row.content;
  const updated = { ...content, ...fields };
  await db.run("UPDATE lesson_blocks SET content = $1 WHERE id = $2", [JSON.stringify(updated), blockId]);
}

function downloadWithYtdlp(videoId: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "-f", "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best",
      "--merge-output-format", "mp4",
      "--newline",
      "-o", outputPath,
      `https://www.youtube.com/watch?v=${videoId}`,
    ];

    const proc = spawn("yt-dlp", args, { stdio: ["ignore", "pipe", "pipe"] });
    let lastProgress = 0;

    proc.stderr.on("data", (chunk: Buffer) => {
      const line = chunk.toString();
      const match = line.match(/\[download\]\s+([\d.]+)%/);
      if (match) {
        const pct = Math.floor(parseFloat(match[1]));
        if (pct >= lastProgress + 5) {
          lastProgress = pct;
          // Download is 0-60% of total progress
          broadcast(currentBlockId, "downloading", Math.floor(pct * 0.6));
        }
      }
    });

    proc.stdout.on("data", (chunk: Buffer) => {
      const line = chunk.toString();
      const match = line.match(/\[download\]\s+([\d.]+)%/);
      if (match) {
        const pct = Math.floor(parseFloat(match[1]));
        if (pct >= lastProgress + 5) {
          lastProgress = pct;
          broadcast(currentBlockId, "downloading", Math.floor(pct * 0.6));
        }
      }
    });

    let currentBlockId = 0; // Will be set before call

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`yt-dlp exited with code ${code}`));
    });

    proc.on("error", (err) => reject(err));

    // Expose blockId setter
    (proc as any)._setBlockId = (id: number) => { currentBlockId = id; };
  });
}

export async function importVideo(job: ImportJob): Promise<void> {
  const tmpFile = path.join(os.tmpdir(), `stoa-import-${job.blockId}-${job.videoId}.mp4`);

  try {
    // Mark as importing
    await updateBlockContent(job.blockId, {
      youtube_url: job.youtubeUrl,
      import_status: "importing",
      import_progress: 0,
      import_error: null,
    });
    broadcast(job.blockId, "downloading", 0);

    // Step 1: Download with yt-dlp
    const downloadPromise = downloadWithYtdlp(job.videoId, tmpFile);
    // Set blockId for progress broadcast
    // We need a cleaner approach — refactor downloadWithYtdlp to accept blockId

    await downloadWithProgress(job.blockId, job.videoId, tmpFile);

    // Step 2: Upload to Bunny
    broadcast(job.blockId, "uploading", 65);
    await updateBlockContent(job.blockId, { import_progress: 65 });

    const videoBuffer = await readFile(tmpFile);
    const title = `youtube-${job.videoId}`;
    const bunnyVideo = await bunnyService.createVideo(title);
    const bunnyGuid = bunnyVideo.guid;

    broadcast(job.blockId, "uploading", 80);
    await bunnyService.uploadVideo(bunnyGuid, videoBuffer);

    broadcast(job.blockId, "uploading", 95);

    // Step 3: Update block with Bunny URL
    const bunnyUrl = bunnyService.getPlayerUrl(bunnyGuid);
    await updateBlockContent(job.blockId, {
      url: bunnyUrl,
      import_status: "completed",
      import_progress: 100,
      bunny_video_id: bunnyGuid,
    });

    broadcast(job.blockId, "completed", 100, { bunnyUrl });
    console.log(`[youtube-import] Block ${job.blockId}: import completed → ${bunnyUrl}`);
  } catch (err: any) {
    const errorMsg = err?.message || "Unknown error";
    console.error(`[youtube-import] Block ${job.blockId}: failed — ${errorMsg}`);

    await updateBlockContent(job.blockId, {
      import_status: "error",
      import_error: errorMsg,
    });
    broadcast(job.blockId, "error", 0, { error: errorMsg });
  } finally {
    // Cleanup temp file
    try { await unlink(tmpFile); } catch { /* file may not exist */ }
  }
}

async function downloadWithProgress(blockId: number, videoId: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "-f", "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best",
      "--merge-output-format", "mp4",
      "--newline",
      "-o", outputPath,
      `https://www.youtube.com/watch?v=${videoId}`,
    ];

    const proc = spawn("yt-dlp", args, { stdio: ["ignore", "pipe", "pipe"] });
    let lastProgress = 0;

    function parseProgress(chunk: Buffer) {
      const line = chunk.toString();
      const match = line.match(/\[download\]\s+([\d.]+)%/);
      if (match) {
        const pct = Math.floor(parseFloat(match[1]));
        if (pct >= lastProgress + 5) {
          lastProgress = pct;
          const totalProgress = Math.floor(pct * 0.6); // Download = 0-60%
          broadcast(blockId, "downloading", totalProgress);
          updateBlockContent(blockId, { import_progress: totalProgress }).catch(() => {});
        }
      }
    }

    proc.stdout.on("data", parseProgress);
    proc.stderr.on("data", parseProgress);

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`yt-dlp exited with code ${code}`));
    });

    proc.on("error", (err) => reject(err));
  });
}

// Startup cleanup: reset stale "importing" blocks
export async function cleanupStaleImports() {
  const stale = await db.all(
    "SELECT id, content FROM lesson_blocks WHERE block_type = 'video' AND content::text LIKE '%importing%'"
  );

  for (const row of stale) {
    const content = typeof row.content === "string" ? JSON.parse(row.content) : row.content;
    if (content.import_status === "importing") {
      content.import_status = "error";
      content.import_error = "Import interrupted by server restart";
      await db.run("UPDATE lesson_blocks SET content = $1 WHERE id = $2", [JSON.stringify(content), row.id]);
      console.log(`[youtube-import] Cleaned up stale import for block ${row.id}`);
    }
  }
}
```

- [ ] **Step 2: Remove dead downloadWithYtdlp function**

The file above has a dead `downloadWithYtdlp` function (the first one). Remove lines from `function downloadWithYtdlp` through the closing `}` just before `export async function importVideo`. Only keep `downloadWithProgress` which is the actual working function.

- [ ] **Step 3: Commit**

```bash
git add server/services/youtubeImportService.ts
git commit -m "feat: youtube import service (yt-dlp → bunny)"
```

---

### Task 4: Hook lesson block routes to trigger import

**Files:**
- Modify: `server/routes/lessonBlocks.ts`

- [ ] **Step 1: Add import at top of file**

Add after existing imports in `server/routes/lessonBlocks.ts`:

```typescript
import { isYouTubeUrl, extractVideoId, importVideo } from "../services/youtubeImportService";
```

- [ ] **Step 2: Add trigger helper function**

Add before the router definition:

```typescript
function triggerImportIfYouTube(blockId: number, content: any) {
  if (!content?.url || !isYouTubeUrl(content.url)) return;
  if (content.import_status === "importing" || content.import_status === "completed") return;

  const videoId = extractVideoId(content.url);
  if (!videoId) return;

  // Fire and forget
  importVideo({ blockId, youtubeUrl: content.url, videoId }).catch((err) => {
    console.error(`[youtube-import] Failed for block ${blockId}:`, err.message);
  });
}
```

- [ ] **Step 3: Hook into POST (create) route**

In the `router.post("/")` handler, after `res.status(201).json(result);`, add:

```typescript
    triggerImportIfYouTube(result.id, content);
```

- [ ] **Step 4: Hook into PUT (update) route**

In the `router.put("/:id")` handler, after `res.json({ success: true });`, add:

```typescript
    if (content !== undefined) {
      triggerImportIfYouTube(id, content);
    }
```

- [ ] **Step 5: Hook into batch save route**

In the `router.put("/lesson/:lessonId/batch")` handler, after `res.json({ ids });`, add:

```typescript
    // Check each saved block for YouTube URLs
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].block_type === "video") {
        triggerImportIfYouTube(ids[i], blocks[i].content);
      }
    }
```

- [ ] **Step 6: Commit**

```bash
git add server/routes/lessonBlocks.ts
git commit -m "feat: auto-trigger youtube import on block save"
```

---

### Task 5: Call cleanupStaleImports on startup

**Files:**
- Modify: `server/index.ts`

- [ ] **Step 1: Add import and call**

In `server/index.ts`, add the import near the top:

```typescript
import { cleanupStaleImports } from "./services/youtubeImportService";
```

Then, inside the `startServer()` function, after the line that logs "STOA running on...", add:

```typescript
    cleanupStaleImports().catch((err) =>
      console.error("[youtube-import] Cleanup failed:", err.message)
    );
```

- [ ] **Step 2: Commit**

```bash
git add server/index.ts
git commit -m "feat: cleanup stale youtube imports on startup"
```

---

### Task 6: Update VideoPlayer with import progress

**Files:**
- Modify: `src/components/blocks/VideoPlayer.tsx`
- Modify: `src/components/blocks/BlockRenderer.tsx`

- [ ] **Step 1: Add import progress props and WS hook to VideoPlayer**

Replace the full contents of `src/components/blocks/VideoPlayer.tsx`:

```typescript
import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, RefreshCw, Loader2 } from 'lucide-react';

/* ── Types ── */

interface VideoPlayerProps {
  src: string;
  blockId?: number;
  importStatus?: 'importing' | 'completed' | 'error';
  importProgress?: number;
  importError?: string;
}

type ImportState = {
  status: 'idle' | 'downloading' | 'uploading' | 'completed' | 'error';
  progress: number;
  bunnyUrl?: string;
  error?: string;
};

type VideoSource =
  | { type: 'youtube'; videoId: string }
  | { type: 'bunny'; embedUrl: string }
  | { type: 'unknown'; url: string };

/* ── URL detection ── */

function detectSource(src: string): VideoSource {
  const ytMatch = src.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return { type: 'youtube', videoId: ytMatch[1] };

  if (src.includes('iframe.mediadelivery.net') || src.includes('video.bunnycdn.com')) {
    return { type: 'bunny', embedUrl: src };
  }

  return { type: 'unknown', url: src };
}

/* ── WebSocket hook for import progress ── */

function useImportProgress(blockId: number | undefined, initialStatus?: string): ImportState {
  const [state, setState] = useState<ImportState>({
    status: initialStatus === 'importing' ? 'downloading' : initialStatus === 'error' ? 'error' : 'idle',
    progress: 0,
  });

  useEffect(() => {
    if (!blockId) return;

    function handleMessage(event: MessageEvent) {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'video_import' && msg.blockId === blockId) {
          setState({
            status: msg.status,
            progress: msg.progress ?? 0,
            bunnyUrl: msg.bunnyUrl,
            error: msg.error,
          });
        }
      } catch { /* ignore non-JSON */ }
    }

    // Find existing WebSocket connection
    // The STOA app stores its WS on window.__stoaWs (set by the WS provider)
    const checkWs = () => {
      const ws = (window as any).__stoaWs as WebSocket | undefined;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.addEventListener('message', handleMessage);
        return () => ws.removeEventListener('message', handleMessage);
      }
      return undefined;
    };

    let cleanup = checkWs();
    if (!cleanup) {
      // Retry finding WS every 500ms for up to 5s
      const interval = setInterval(() => {
        cleanup = checkWs();
        if (cleanup) clearInterval(interval);
      }, 500);
      const timeout = setTimeout(() => clearInterval(interval), 5000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
        cleanup?.();
      };
    }

    return cleanup;
  }, [blockId]);

  return state;
}

/* ── Component ── */

export default function VideoPlayer({ src, blockId, importStatus, importProgress, importError }: VideoPlayerProps) {
  const importState = useImportProgress(blockId, importStatus);

  // If import completed via WS, use the new Bunny URL
  const effectiveSrc = importState.bunnyUrl || src;
  const source = detectSource(effectiveSrc);

  // Show import progress overlay for YouTube videos being imported
  if (importState.status === 'downloading' || importState.status === 'uploading') {
    const ytMatch = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const ytId = ytMatch?.[1];

    return (
      <div className="aspect-video bg-black overflow-hidden border border-line shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4)] relative">
        {ytId && (
          <img
            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
            alt="Video thumbnail"
            className="w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <Loader2 size={32} className="text-white animate-spin" />
          <div className="w-48 sm:w-64">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold rounded-full transition-all duration-500"
                style={{ width: `${importState.progress}%` }}
              />
            </div>
          </div>
          <span className="text-white/80 text-xs font-bold uppercase tracking-widest">
            {importState.status === 'downloading' ? 'Baixando video...' : 'Enviando para CDN...'}
          </span>
          <span className="text-white/50 text-xs">
            {importState.progress}%
          </span>
        </div>
      </div>
    );
  }

  // Import error: show retry
  if (importState.status === 'error' || importStatus === 'error') {
    const ytMatch = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const ytId = ytMatch?.[1];
    const errorMsg = importState.error || importError || 'Falha no import';

    return (
      <div className="aspect-video bg-black overflow-hidden border border-line shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4)] relative">
        {ytId && (
          <img
            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
            alt="Video thumbnail"
            className="w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <p className="text-white/80 text-sm font-bold">Falha no import</p>
          <p className="text-white/40 text-xs max-w-xs text-center">{errorMsg}</p>
          <a
            href={ytId ? `https://www.youtube.com/watch?v=${ytId}` : src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white/70 border border-white/20 hover:border-white/40 transition-colors mt-2"
          >
            <Play size={14} fill="currentColor" />
            Assistir no YouTube
          </a>
        </div>
      </div>
    );
  }

  // Bunny embed
  if (source.type === 'bunny') {
    return (
      <div className="aspect-video bg-black overflow-hidden border border-line shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4)]">
        <iframe
          src={source.embedUrl}
          className="w-full h-full"
          title="Video"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // YouTube (not yet imported or import not triggered): thumbnail + open
  if (source.type === 'youtube') {
    return (
      <a
        href={`https://www.youtube.com/watch?v=${source.videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-video bg-black overflow-hidden border border-line shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4)] relative group"
      >
        <img
          src={`https://img.youtube.com/vi/${source.videoId}/hqdefault.jpg`}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center transition-colors shadow-lg">
            <Play size={32} className="text-ink ml-1" fill="currentColor" />
          </div>
        </div>
      </a>
    );
  }

  // Unknown: native video
  return (
    <div className="aspect-video bg-black overflow-hidden border border-line shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4)]">
      <video src={source.url} controls className="w-full h-full" />
    </div>
  );
}
```

- [ ] **Step 2: Update BlockRenderer to pass import fields**

In `src/components/blocks/BlockRenderer.tsx`, update the VideoBlock function:

```typescript
function VideoBlock({ content, blockId }: { content: Record<string, any>; blockId?: number }) {
  const url = content.url || '';

  if (!url) {
    return (
      <div className="aspect-video bg-surface border border-line flex items-center justify-center text-warm-gray/40 font-serif italic">
        Nenhum video configurado
      </div>
    );
  }

  return (
    <VideoPlayer
      src={url}
      blockId={blockId}
      importStatus={content.import_status}
      importProgress={content.import_progress}
      importError={content.import_error}
    />
  );
}
```

And update the switch case in `BlockRenderer`:

```typescript
    case 'video':
      return <VideoBlock content={block.content} blockId={block.id} />;
```

- [ ] **Step 3: Expose WebSocket on window for VideoPlayer**

Find where the WebSocket connection is created in the frontend. Look in `src/stores/` or `src/hooks/` for the WS setup. After the WebSocket connects and authenticates, add:

```typescript
(window as any).__stoaWs = ws;
```

This lets VideoPlayer listen for import progress messages on the existing connection.

- [ ] **Step 4: Commit**

```bash
git add src/components/blocks/VideoPlayer.tsx src/components/blocks/BlockRenderer.tsx
git commit -m "feat(video): import progress overlay + ws listener"
```

---

### Task 7: Test end-to-end

- [ ] **Step 1: Build and deploy**

```bash
# Push
git push origin main

# Deploy on server
ssh deploy@178.156.252.78 "cd ~/apps/stoa && git pull origin main && docker build --no-cache -t nexo-stoa:latest . && docker service update --image nexo-stoa:latest --force nexo_stoa"
```

- [ ] **Step 2: Verify yt-dlp is available in container**

```bash
ssh deploy@178.156.252.78 "docker exec \$(docker ps -q -f name=nexo_stoa) yt-dlp --version"
```

Expected: a version string like `2024.12.13` or similar.

- [ ] **Step 3: Test import flow**

1. Go to `membros.onexos.com.br/admin/editor/14`
2. Edit the video block, paste a YouTube URL (use `https://www.youtube.com/watch?v=pSJz4DzvbFI`)
3. Save the lesson
4. Watch the video block — should show progress overlay (downloading → uploading → completed)
5. After completion, the video should play inline via Bunny.net iframe

- [ ] **Step 4: Check logs**

```bash
ssh deploy@178.156.252.78 "docker service logs nexo_stoa --tail 30 2>&1 | grep youtube-import"
```

Expected: log lines showing import progress and completion.

- [ ] **Step 5: Verify DB updated**

```bash
ssh deploy@178.156.252.78 "docker exec \$(docker ps -q -f name=nexo_stoa) node -e \"
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(\\\"SELECT id, content FROM lesson_blocks WHERE block_type = 'video' AND content::text LIKE '%bunny%'\\\").then(r => { console.log(JSON.stringify(r.rows, null, 2)); pool.end(); });
\""
```

Expected: block content has `import_status: "completed"`, `bunny_video_id`, and Bunny URL.
