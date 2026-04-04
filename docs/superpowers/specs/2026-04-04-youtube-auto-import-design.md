# YouTube Auto-Import to Bunny.net — Design Spec

**Date:** 2026-04-04
**Status:** Approved

## Problem

YouTube videos embedded via iframe can be blocked by the video owner (embed disabled). The STOA platform needs a way to automatically import YouTube videos to Bunny.net CDN so they always play inline.

## Solution

When an admin saves a video block with a YouTube URL, the backend automatically downloads the video via `yt-dlp`, uploads it to Bunny.net Stream, and replaces the URL in the database. Progress is shown inline in the video block via WebSocket.

## Flow

```
Admin saves video block with YouTube URL
  → Backend detects YouTube URL in lessonBlocks save/update
  → Spawns async import job (does NOT block the save response)
  → yt-dlp downloads mp4 to /tmp
  → Uploads to Bunny.net Stream via existing bunnyService
  → Deletes temp file
  → Updates lesson_block content.url to Bunny CDN URL
  → Sends WebSocket message at each stage
  → VideoPlayer component shows progress inline, swaps to Bunny player on completion
```

## Detection

A YouTube URL is any URL matching:
```
/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
```

Detection happens in the lesson blocks route, on POST (create) and PUT (update) of blocks with `block_type === 'video'`. If `content.url` matches YouTube AND `content.import_status` is not already `'importing'` or `'completed'`, the import is triggered.

## Database Changes

No new tables. The `lesson_blocks.content` JSONB gains optional fields:

```typescript
// content for video blocks
{
  url: string;                          // Current playback URL (YouTube initially, Bunny after import)
  youtube_url?: string;                 // Original YouTube URL (preserved for reference)
  import_status?: 'importing' | 'completed' | 'error';
  import_progress?: number;             // 0-100
  import_error?: string;                // Error message if failed
  bunny_video_id?: string;             // Bunny video GUID after upload
}
```

## New Files

### `server/services/youtubeImportService.ts`

Single service that orchestrates the entire import:

```typescript
interface ImportJob {
  blockId: number;
  youtubeUrl: string;
  videoId: string;        // YouTube video ID (11 chars)
  userId: number;         // Admin who triggered it
}

async function importYouTubeVideo(job: ImportJob): Promise<void>
```

**Steps:**
1. Update block: `import_status = 'importing'`, `youtube_url = original URL`
2. Broadcast WS: `{ type: "video_import", blockId, status: "downloading", progress: 0 }`
3. Spawn `yt-dlp` with `--newline --progress` flags, parse stderr for progress %
4. Broadcast WS progress updates every 5% change
5. On download complete, broadcast `status: "uploading"`
6. Read file into buffer, call `bunnyService.createVideo(title)` then `bunnyService.uploadVideo(guid, buffer)`
7. Delete temp file
8. Update block content: `url = bunnyService.getPlayerUrl(guid)`, `import_status = 'completed'`, `bunny_video_id = guid`
9. Broadcast WS: `status: "completed"` with new `bunnyUrl`
10. On any error: update block `import_status = 'error'`, `import_error = message`, broadcast error

**yt-dlp command:**
```bash
yt-dlp -f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best" \
  --merge-output-format mp4 \
  --newline \
  -o "/tmp/stoa-import-{videoId}.mp4" \
  "https://www.youtube.com/watch?v={videoId}"
```

**Progress parsing:** yt-dlp with `--newline` outputs lines like `[download]  45.2% of 150.00MiB`. Parse with regex `/\[download\]\s+([\d.]+)%/`.

### Route changes: `server/routes/lessonBlocks.ts`

After successful save/update of a video block, check if URL is YouTube:

```typescript
// After block is saved
if (block.block_type === 'video' && isYouTubeUrl(block.content.url)) {
  if (!block.content.import_status || block.content.import_status === 'error') {
    // Fire and forget — don't await
    youtubeImportService.importYouTubeVideo({
      blockId: block.id,
      youtubeUrl: block.content.url,
      videoId: extractYouTubeId(block.content.url),
      userId: req.user.id,
    }).catch(err => logger.error({ err }, 'YouTube import failed'));
  }
}
```

### WebSocket changes: `server/ws.ts`

Add broadcast function for import progress (reuses existing `broadcastToUser`):

```typescript
// New outgoing message type
{ type: "video_import", blockId: number, status: string, progress?: number, bunnyUrl?: string, error?: string }
```

### Frontend: `src/components/blocks/VideoPlayer.tsx`

Add import progress overlay when `import_status === 'importing'`:

- Listen to WebSocket messages of type `video_import` matching current block ID
- Show semi-transparent overlay on top of YouTube thumbnail with:
  - Progress bar (gold color, matching design system)
  - Status text: "Baixando video..." / "Enviando para CDN..." / "Erro: {message}"
  - Progress percentage
- On `status: "completed"`: update URL to `bunnyUrl`, re-render as Bunny iframe
- On `status: "error"`: show error message with "Tentar novamente" button

**Visual states:**
```
[Importing] YouTube thumbnail + overlay:
  ┌──────────────────────────────────┐
  │         (thumbnail)              │
  │    ████████░░░░░░░░  45%         │
  │    Baixando video...             │
  └──────────────────────────────────┘

[Completed] Normal Bunny iframe player

[Error] YouTube thumbnail + error:
  ┌──────────────────────────────────┐
  │         (thumbnail)              │
  │    Falha no import               │
  │    [Tentar novamente]            │
  └──────────────────────────────────┘
```

### Dockerfile changes

Add to the build stage or runtime stage:

```dockerfile
RUN apk add --no-cache python3 py3-pip ffmpeg && \
    pip3 install --break-system-packages yt-dlp
```

## Props/Interface for VideoPlayer

```typescript
interface VideoPlayerProps {
  src: string;
  blockId?: number;           // Needed for WS progress matching
  importStatus?: 'importing' | 'completed' | 'error';
  importProgress?: number;
  importError?: string;
}
```

The BlockRenderer passes these from the block's content:

```typescript
case 'video':
  return (
    <VideoPlayer
      src={block.content.url}
      blockId={block.id}
      importStatus={block.content.import_status}
      importProgress={block.content.import_progress}
      importError={block.content.import_error}
    />
  );
```

## Edge Cases

- **Video already imported (Bunny URL):** No-op, import not triggered
- **Import already in progress:** Check `import_status === 'importing'`, skip
- **Previous import failed:** Re-trigger on next save (user can re-save to retry)
- **yt-dlp fails (private video, geo-block):** Set error status, keep YouTube URL as fallback
- **Large video (>2GB):** yt-dlp handles streaming download; Bunny upload uses buffer (may need chunked upload for very large files — defer to v2)
- **Server restart during import:** Import is lost. Block stays with `import_status: 'importing'`. On next page load, frontend detects stale status and shows retry. A startup cleanup sets stale `importing` blocks back to no status.
- **Multiple admins editing same block:** WebSocket broadcasts to all connected admins
- **Temp file cleanup:** Always in finally block, even on error

## Environment Variables

Existing (already in bunnyService):
- `BUNNY_API_KEY` — Bunny.net API key
- `BUNNY_LIBRARY_ID` — Bunny Stream library ID
- `BUNNY_CDN_HOSTNAME` — CDN hostname for player URLs

No new env vars needed.

## Security

- Only authenticated admins can trigger import (auth middleware on lesson blocks routes)
- yt-dlp URL is validated (must match YouTube regex) before spawning process
- Temp files use unique names with block ID to prevent collisions
- Temp files deleted in finally block

## Out of Scope

- Batch import (import many videos at once)
- Progress persistence across server restarts
- Chunked upload for very large videos (>2GB)
- Video transcoding options
- Import from other platforms (Vimeo, etc.)
