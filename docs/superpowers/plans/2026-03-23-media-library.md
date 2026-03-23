# Media Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full CRUD media library with Bunny.net video integration, PostgreSQL persistence, and connected admin UI.

**Architecture:** New `media_assets` table in PG. Videos uploaded to Bunny Stream (two-step: create + upload binary). Images/docs saved locally. Frontend AdminMedia fetches from `/api/media` REST endpoints. Backend follows existing repo→service→route pattern.

**Tech Stack:** PostgreSQL (pg), Bunny Stream API (fetch), multer (upload), Express routes, React (AdminMedia.tsx)

**Spec:** `docs/superpowers/specs/2026-03-23-media-library-design.md`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `server/db/schema.ts` | Modify | Add `media_assets` table + 4 indices |
| `server/services/bunnyService.ts` | Create | Bunny Stream API wrapper (create, upload, get, delete, URLs) |
| `server/repositories/mediaRepository.ts` | Create | PG CRUD for media_assets |
| `server/services/mediaService.ts` | Create | Business logic (upload routing, metadata, storage stats) |
| `server/routes/media.ts` | Create | REST endpoints with multer + auth |
| `server/index.ts` | Modify | Import + mount mediaRouter at `/api/media` |
| `src/types/index.ts` | Modify | Add MediaAsset, StorageStats interfaces |
| `src/services/api.ts` | Modify | Add media API functions |
| `src/components/admin/AdminMedia.tsx` | Rewrite | Connect to real API, add edit/delete/bulk/pagination |

---

## Task 1: Database Schema

**Files:**
- Modify: `server/db/schema.ts`

- [ ] **Step 1: Add media_assets table to schema**

Append to the DDL string in `initializeSchema()`, after the last CREATE TABLE and before the indices block:

```sql
CREATE TABLE IF NOT EXISTS media_assets (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER NOT NULL,
  uploaded_by INTEGER NOT NULL,
  name TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_path TEXT,
  url TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  bunny_video_id TEXT,
  bunny_status TEXT,
  source TEXT NOT NULL DEFAULT 'local',
  description TEXT,
  tags TEXT DEFAULT '[]',
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY(workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY(uploaded_by) REFERENCES users(id)
);
```

Add indices in the indices block:

```sql
CREATE INDEX IF NOT EXISTS idx_media_assets_workspace ON media_assets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(file_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_uploaded_by ON media_assets(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_assets_archived ON media_assets(is_archived);
```

- [ ] **Step 2: Verify schema runs**

Run: `npx tsx -e "import 'dotenv/config'; import { initializeSchema } from './server/db/schema'; initializeSchema().then(() => { console.log('OK'); process.exit(0); })"`

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add server/db/schema.ts
git commit -m "feat(media): add media_assets table to schema"
```

---

## Task 2: Bunny Stream Service

**Files:**
- Create: `server/services/bunnyService.ts`

- [ ] **Step 1: Create bunnyService.ts**

```typescript
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

export async function createVideo(title: string) {
  const res = await fetch(libraryUrl("/videos"), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Bunny createVideo failed: ${res.status}`);
  return res.json() as Promise<{ guid: string; [k: string]: any }>;
}

export async function uploadVideo(videoId: string, buffer: Buffer) {
  const res = await fetch(libraryUrl(`/videos/${videoId}`), {
    method: "PUT",
    headers: headers("application/octet-stream"),
    body: buffer,
  });
  if (!res.ok) throw new Error(`Bunny uploadVideo failed: ${res.status}`);
  return res.json();
}

export async function getVideo(videoId: string) {
  const res = await fetch(libraryUrl(`/videos/${videoId}`), {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Bunny getVideo failed: ${res.status}`);
  return res.json() as Promise<{
    guid: string;
    title: string;
    length: number;
    status: number;
    encodeProgress: number;
    width: number;
    height: number;
    storageSize: number;
    thumbnailFileName: string;
  }>;
}

export async function deleteVideo(videoId: string) {
  const res = await fetch(libraryUrl(`/videos/${videoId}`), {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Bunny deleteVideo failed: ${res.status}`);
}

export function getPlayerUrl(videoId: string) {
  return `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}`;
}

export function getThumbnailUrl(videoId: string) {
  return `https://${CDN_HOSTNAME}/${videoId}/thumbnail.jpg`;
}

// Bunny status codes: 0=queued, 1=processing, 2=encoding, 3=finished, 4=resolution_finished, 5=failed
export function mapBunnyStatus(status: number): string {
  if (status === 3 || status === 4) return "ready";
  if (status === 5) return "failed";
  return "processing";
}
```

- [ ] **Step 2: Verify Bunny connection**

Run: `npx tsx -e "import 'dotenv/config'; import { createVideo, deleteVideo } from './server/services/bunnyService'; createVideo('test-connection').then(v => { console.log('Created:', v.guid); return deleteVideo(v.guid); }).then(() => { console.log('Deleted. Bunny OK'); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); })"`

Expected: `Created: {guid}` then `Deleted. Bunny OK`

- [ ] **Step 3: Commit**

```bash
git add server/services/bunnyService.ts
git commit -m "feat(media): add Bunny Stream API service"
```

---

## Task 3: Media Repository

**Files:**
- Create: `server/repositories/mediaRepository.ts`

- [ ] **Step 1: Create mediaRepository.ts**

Import `db` from `../db/connection`. Implement all functions:

- `create(data)` — INSERT with all fields, RETURNING id. Return the full row via findById.
- `findById(id)` — SELECT * WHERE id = $1 AND is_archived = 0
- `list(workspaceId, filters)` — Dynamic WHERE with:
  - `workspace_id = $1` (always)
  - `is_archived = $N` (default 0)
  - `file_type = $N` (if type filter)
  - `name ILIKE $N` (if search, use `%${search}%`)
  - `tags ILIKE $N` (if tags filter, search within JSON text)
  - ORDER BY created_at DESC
  - LIMIT $N OFFSET $N
  - Also return total count via separate COUNT query
- `update(id, data)` — Dynamic SET using `buildSetClause` from `../db/helpers`, add `updated_at = NOW()`
- `archive(id)` — UPDATE SET is_archived = 1, updated_at = NOW()
- `restore(id)` — UPDATE SET is_archived = 0, updated_at = NOW()
- `hardDelete(id)` — DELETE WHERE id = $1. Return the row first (for cleanup).
- `getStorageStats(workspaceId)` — SELECT file_type, COUNT(*) as count, SUM(size) as total_size FROM media_assets WHERE workspace_id = $1 AND is_archived = 0 GROUP BY file_type
- `findByBunnyId(bunnyVideoId)` — SELECT * WHERE bunny_video_id = $1

- [ ] **Step 2: Verify repo**

Run: quick insert + select + delete test via tsx.

- [ ] **Step 3: Commit**

```bash
git add server/repositories/mediaRepository.ts
git commit -m "feat(media): add media repository with full CRUD"
```

---

## Task 4: Media Service

**Files:**
- Create: `server/services/mediaService.ts`

- [ ] **Step 1: Create mediaService.ts**

Import: `mediaRepo`, `bunnyService`, `saveToLocal`, `deleteLocal`, `uniqueFilename` from uploadService.

Functions:

- `uploadMedia(file: { buffer, originalname, mimetype, size }, workspaceId, userId)`:
  - Determine `file_type` from mimetype (image/video/document)
  - If video: call `bunnyService.createVideo(name)` → get guid → `bunnyService.uploadVideo(guid, buffer)` → save to DB with source=bunny, url=playerUrl, bunny_video_id=guid, bunny_status=processing
  - If image/doc: `uniqueFilename()` → `saveToLocal()` → save to DB with source=local, file_path, url
  - Return the created media asset

- `listMedia(workspaceId, filters)` → call repo.list, return { items, total }
- `getMedia(id)` → repo.findById, throw 404 if null
- `updateMedia(id, data)` → repo.update, return updated row
- `deleteMedia(id)` → repo.archive
- `permanentDelete(id)` → repo.findById → if source=local: deleteLocal(file_path). If source=bunny: bunnyService.deleteVideo(bunny_video_id). Then repo.hardDelete
- `restoreMedia(id)` → repo.restore
- `getStorageStats(workspaceId)` → repo.getStorageStats
- `syncBunnyStatus(id)` → repo.findById → bunnyService.getVideo(bunny_video_id) → repo.update bunny_status + duration + url (thumbnail)

- [ ] **Step 2: Commit**

```bash
git add server/services/mediaService.ts
git commit -m "feat(media): add media service with upload routing"
```

---

## Task 5: Media Routes + Mount

**Files:**
- Create: `server/routes/media.ts`
- Modify: `server/index.ts`

- [ ] **Step 1: Create media.ts routes**

Use multer memory storage (reuse config from upload.ts — 50MB limit). Auth middleware on all routes. Admin check on delete/permanent/restore.

8 endpoints as defined in spec. Each handler: try/catch → res.json or res.status(error).

- [ ] **Step 2: Mount in server/index.ts**

Add import: `import mediaRouter from "./routes/media";`
Add mount BEFORE postsRouter: `app.use("/api/media", mediaRouter);`

- [ ] **Step 3: Restart server and test**

```bash
# Upload an image
curl -X POST http://localhost:4747/api/media -H "Authorization: Bearer $TOKEN" -F "file=@test.jpg"

# List
curl http://localhost:4747/api/media?workspaceId=1 -H "Authorization: Bearer $TOKEN"

# Stats
curl http://localhost:4747/api/media/stats?workspaceId=1 -H "Authorization: Bearer $TOKEN"
```

- [ ] **Step 4: Commit**

```bash
git add server/routes/media.ts server/index.ts
git commit -m "feat(media): add REST endpoints and mount router"
```

---

## Task 6: Frontend Types + API Functions

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/services/api.ts`

- [ ] **Step 1: Add types**

```typescript
export interface MediaAsset {
  id: number;
  workspace_id: number;
  uploaded_by: number;
  name: string;
  original_filename: string;
  mime_type: string;
  file_type: 'image' | 'video' | 'document';
  file_path: string | null;
  url: string;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  bunny_video_id: string | null;
  bunny_status: string | null;
  source: 'local' | 'bunny';
  description: string | null;
  tags: string;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

export interface StorageStats {
  image: { count: number; total_size: number };
  video: { count: number; total_size: number };
  document: { count: number; total_size: number };
}
```

- [ ] **Step 2: Add API functions in api.ts**

```typescript
export async function listMedia(params: {
  workspaceId: number; type?: string; search?: string; page?: number; limit?: number;
}): Promise<{ items: MediaAsset[]; total: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null) qs.set(k, String(v)); });
  const res = await authFetch(`/api/media?${qs}`);
  if (!res.ok) throw new Error('Falha ao listar midias');
  return res.json();
}

export async function uploadMedia(file: File, workspaceId: number): Promise<MediaAsset> {
  const form = new FormData();
  form.append('file', file);
  form.append('workspaceId', String(workspaceId));
  const token = getAccessToken();
  const res = await fetch('/api/media', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) throw new Error('Falha no upload');
  return res.json();
}

export async function updateMedia(id: number, data: { name?: string; description?: string; tags?: string }): Promise<MediaAsset> {
  const res = await authFetch(`/api/media/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar');
  return res.json();
}

export async function deleteMedia(id: number): Promise<void> {
  const res = await authFetch(`/api/media/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao deletar');
}

export async function getMediaStats(workspaceId: number): Promise<StorageStats> {
  const res = await authFetch(`/api/media/stats?workspaceId=${workspaceId}`);
  if (!res.ok) throw new Error('Falha ao buscar stats');
  return res.json();
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts src/services/api.ts
git commit -m "feat(media): add frontend types and API functions"
```

---

## Task 7: AdminMedia.tsx — Rewrite

**Files:**
- Rewrite: `src/components/admin/AdminMedia.tsx`

- [ ] **Step 1: Replace hardcoded data with API fetch**

Remove `defaultAssets`. On mount, call `listMedia({ workspaceId: 1 })` and `getMediaStats(1)`. Store in state.

- [ ] **Step 2: Connect upload to new API**

Replace `uploadFile`/`uploadImage` calls with `uploadMedia(file, workspaceId)`. After upload, prepend new asset to list.

- [ ] **Step 3: Add delete functionality**

Add trash icon button on each card (admin only). On click → confirmation dialog → `deleteMedia(id)` → remove from list.

- [ ] **Step 4: Add edit modal**

Click on card name → open modal with inputs: name, description, tags. Save → `updateMedia(id, data)` → update in list.

- [ ] **Step 5: Add bulk select + bulk delete**

Checkbox on each card. When selection > 0, show "Deletar selecionados" button. Calls `deleteMedia` for each selected id.

- [ ] **Step 6: Add pagination**

"Carregar mais" button when `items.length < total`. Increments page and appends results.

- [ ] **Step 7: Connect storage stats**

Replace hardcoded `storageUsed`/`storageTotal` with real data from `getMediaStats`. Show per-type breakdown.

- [ ] **Step 8: Add Bunny video status badge**

For assets with `source=bunny` and `bunny_status !== 'ready'`, show a badge "Processando..." with spinner.

- [ ] **Step 9: Test full flow manually**

1. Upload image → appears in grid with thumbnail
2. Upload video → appears with "Processando" badge
3. Edit name/description → saves
4. Delete → disappears
5. Bulk select + delete → works
6. Storage stats → real values
7. Search + filter → works
8. Pagination → loads more

- [ ] **Step 10: Commit**

```bash
git add src/components/admin/AdminMedia.tsx
git commit -m "feat(media): connect AdminMedia to real API with full CRUD"
```

---

## Task 8: Final Integration Test + Deploy

- [ ] **Step 1: Run TypeScript check**

```bash
npm run lint
```

- [ ] **Step 2: Test all endpoints via curl**

- [ ] **Step 3: Commit any fixes**

- [ ] **Step 4: Push + deploy**

```bash
git push origin main
ssh deploy@178.156.252.78 "cd ~/apps/stoa && git pull origin main && docker build --no-cache -t nexo-stoa:latest . && docker service update --image nexo-stoa:latest --force nexo_stoa"
```
