# Spec: Biblioteca de Mídias — CRUD Completo

## Contexto

O STOA tem upload funcional (multer → filesystem) e um componente `AdminMedia.tsx` com dados mockados. Falta persistência no banco, integração com Bunny.net pra vídeos, e UI conectada à API real. Esta spec cobre o CRUD completo da biblioteca de mídias.

## Decisões

- **Storage:** Imagens/docs ficam local em `/uploads`. Vídeos vão pro Bunny Stream (Library 614601).
- **Persistência:** Tabela `media_assets` no PostgreSQL com metadata completa.
- **Escopo:** CRUD completo — upload, list, edit metadata, delete, busca, tags, storage stats, bulk ops.

---

## 1. Schema — Tabela `media_assets`

```sql
CREATE TABLE IF NOT EXISTS media_assets (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER NOT NULL,
  uploaded_by INTEGER NOT NULL,
  name TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_type TEXT NOT NULL,              -- 'image' | 'video' | 'document'
  file_path TEXT,                        -- local path (null for bunny videos)
  url TEXT NOT NULL,                     -- public URL (local or CDN)
  size INTEGER NOT NULL DEFAULT 0,       -- bytes
  width INTEGER,                         -- images only
  height INTEGER,                        -- images only
  duration INTEGER,                      -- videos only (seconds)
  bunny_video_id TEXT,                   -- Bunny Stream video GUID (null for local)
  bunny_status TEXT,                     -- 'uploading' | 'processing' | 'ready' | 'failed'
  source TEXT NOT NULL DEFAULT 'local',  -- 'local' | 'bunny'
  description TEXT,
  tags TEXT DEFAULT '[]',                -- JSON array of strings
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY(workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY(uploaded_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_media_assets_workspace ON media_assets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets(file_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_uploaded_by ON media_assets(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_assets_archived ON media_assets(is_archived);
```

---

## 2. Backend — Bunny Stream Service

**Arquivo:** `server/services/bunnyService.ts`

Wrapper pra Bunny Stream API. Env vars: `BUNNY_API_KEY`, `BUNNY_LIBRARY_ID`, `BUNNY_CDN_HOSTNAME`.

**Funções:**
- `createVideo(title)` → POST `https://video.bunnycdn.com/library/{LIB}/videos` → retorna `{ guid, ... }`
- `uploadVideo(videoId, buffer)` → PUT `https://video.bunnycdn.com/library/{LIB}/videos/{ID}` (body = binary)
- `getVideo(videoId)` → GET metadata (status, length, thumbnail)
- `deleteVideo(videoId)` → DELETE
- `listVideos(page, perPage)` → GET list
- `getPlayerUrl(videoId)` → `https://iframe.mediadelivery.net/embed/{LIB}/{ID}`
- `getThumbnailUrl(videoId)` → `https://{CDN_HOSTNAME}/{ID}/thumbnail.jpg`

**Auth header:** `AccessKey: {BUNNY_API_KEY}` em todos os requests.

---

## 3. Backend — Media Repository

**Arquivo:** `server/repositories/mediaRepository.ts`

**Funções:**
- `create(data)` → INSERT RETURNING id
- `findById(id)` → SELECT by id (not archived)
- `list(workspaceId, { type?, search?, tags?, page, limit })` → SELECT com filtros + paginação + total count
- `update(id, data)` → UPDATE (name, description, tags, bunny_status)
- `archive(id)` → SET is_archived = 1
- `restore(id)` → SET is_archived = 0
- `hardDelete(id)` → DELETE
- `getStorageStats(workspaceId)` → SUM(size) grouped by file_type
- `findByBunnyId(bunnyVideoId)` → lookup by bunny GUID

---

## 4. Backend — Media Service

**Arquivo:** `server/services/mediaService.ts`

**Funções:**
- `uploadMedia(file, workspaceId, userId)`:
  - Se vídeo: `bunnyService.createVideo()` → `bunnyService.uploadVideo()` → salva no DB com `source=bunny`
  - Se imagem/doc: `saveToLocal()` → salva no DB com `source=local`
- `listMedia(workspaceId, filters)` → repo.list + formatação
- `getMedia(id)` → repo.findById
- `updateMedia(id, data)` → repo.update (name, description, tags)
- `deleteMedia(id)` → soft delete (archive). Se bunny, não deleta do CDN.
- `permanentDelete(id)` → hard delete + `deleteLocal()` ou `bunnyService.deleteVideo()`
- `restoreMedia(id)` → repo.restore
- `getStorageStats(workspaceId)` → repo.getStorageStats
- `syncBunnyStatus(id)` → poll bunny status e atualiza no DB

---

## 5. Backend — API Routes

**Arquivo:** `server/routes/media.ts`

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/media` | user | Listar mídias (query: type, search, tags, page, limit) |
| GET | `/api/media/stats` | user | Storage stats por tipo |
| GET | `/api/media/:id` | user | Detalhes de uma mídia |
| POST | `/api/media` | user | Upload (multipart/form-data) |
| PUT | `/api/media/:id` | user | Editar metadata (name, description, tags) |
| DELETE | `/api/media/:id` | admin | Soft delete (archive) |
| DELETE | `/api/media/:id/permanent` | admin | Hard delete (remove arquivo) |
| POST | `/api/media/:id/restore` | admin | Restaurar do arquivo |

**Query params GET /api/media:**
- `workspaceId` (required) — workspace scope
- `type` — 'image' | 'video' | 'document' (optional filter)
- `search` — busca por nome (ILIKE)
- `tags` — filtrar por tag (comma-separated)
- `page` — default 1
- `limit` — default 24
- `archived` — 0 (default) ou 1

---

## 6. Frontend — API Functions

**Arquivo:** `src/services/api.ts` (adicionar)

```typescript
// Media Library
export async function listMedia(params): Promise<{ items: MediaAsset[]; total: number }>
export async function getMediaById(id: number): Promise<MediaAsset>
export async function uploadMedia(file: File): Promise<MediaAsset>
export async function updateMedia(id: number, data: { name?, description?, tags? }): Promise<MediaAsset>
export async function deleteMedia(id: number): Promise<void>
export async function permanentDeleteMedia(id: number): Promise<void>
export async function restoreMedia(id: number): Promise<void>
export async function getMediaStats(): Promise<StorageStats>
```

---

## 7. Frontend — AdminMedia.tsx (reescrita)

Substituir dados mockados por API real:

**State:**
- `assets` → vem de `listMedia()` no mount
- `total` + `page` → paginação
- `stats` → vem de `getMediaStats()`

**Features novas:**
- **Fetch on mount** — carrega mídias reais da API
- **Paginação** — botão "Carregar mais" ou infinite scroll
- **Upload com progress** — mostra % via XHR/fetch progress
- **Vídeos via Bunny** — detecta `file.type.startsWith('video/')` → envia pra Bunny
- **Edit modal** — click no card → modal com campos: nome, descrição, tags
- **Delete** — botão delete no card → confirmação → soft delete
- **Bulk select** — checkbox nos cards → bulk delete
- **Storage stats** — busca real de `/api/media/stats`
- **Thumbnail de vídeo** — usa `bunny_thumbnail_url` quando disponível
- **Badge de status** — mostra "Processando..." pra vídeos bunny com status != ready

---

## 8. Integração com Lesson Blocks

O editor de blocos (`lesson_blocks` tipo "video") deve poder selecionar vídeos da biblioteca:
- Modal "Escolher da Biblioteca" no bloco de vídeo
- Filtra por `type=video`
- Seleciona → insere URL do player Bunny no bloco

*(Fase futura — não neste sprint)*

---

## Arquivos a criar/editar

| Arquivo | Ação |
|---|---|
| `server/db/schema.ts` | ADD tabela media_assets + indices |
| `server/services/bunnyService.ts` | NEW — wrapper Bunny Stream API |
| `server/repositories/mediaRepository.ts` | NEW — CRUD PG |
| `server/services/mediaService.ts` | NEW — lógica de negócio |
| `server/routes/media.ts` | NEW — endpoints REST |
| `server/index.ts` | ADD import + mount `/api/media` |
| `src/services/api.ts` | ADD funções media |
| `src/types/index.ts` | ADD MediaAsset type |
| `src/components/admin/AdminMedia.tsx` | REWRITE — conectar API real |

---

## Verificação

1. Upload imagem → aparece no grid com thumbnail real
2. Upload vídeo → vai pro Bunny, mostra "Processando", depois "Ready" com thumbnail
3. Edit metadata → modal, salva nome/descrição/tags
4. Delete → soft delete, some do grid
5. Storage stats → valores reais
6. Busca por nome → filtra
7. Filtro por tipo → funciona
8. Paginação → carrega mais itens
