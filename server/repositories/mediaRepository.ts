import db from "../db/connection";
import { buildSetClause } from "../db/helpers";

interface MediaAsset {
  id: number;
  workspace_id: number;
  uploaded_by: number;
  name: string;
  original_filename: string;
  mime_type: string;
  file_type: string;
  file_path: string | null;
  url: string;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  bunny_video_id: string | null;
  bunny_status: string | null;
  source: string;
  description: string | null;
  tags: string;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

interface ListFilters {
  type?: string;
  search?: string;
  tags?: string;
  archived?: number;
  page?: number;
  limit?: number;
}

export async function create(data: {
  workspace_id: number;
  uploaded_by: number;
  name: string;
  original_filename: string;
  mime_type: string;
  file_type: string;
  file_path?: string;
  url: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  bunny_video_id?: string;
  bunny_status?: string;
  source?: string;
  description?: string;
  tags?: string;
}): Promise<MediaAsset | null> {
  const result = await db.run(
    `INSERT INTO media_assets
       (workspace_id, uploaded_by, name, original_filename, mime_type, file_type,
        file_path, url, size, width, height, duration,
        bunny_video_id, bunny_status, source, description, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     RETURNING id`,
    [
      data.workspace_id,
      data.uploaded_by,
      data.name,
      data.original_filename,
      data.mime_type,
      data.file_type,
      data.file_path ?? null,
      data.url,
      data.size,
      data.width ?? null,
      data.height ?? null,
      data.duration ?? null,
      data.bunny_video_id ?? null,
      data.bunny_status ?? null,
      data.source ?? "local",
      data.description ?? null,
      data.tags ?? "[]",
    ]
  );
  const id = result.rows[0].id as number;
  return findById(id);
}

export async function findById(id: number): Promise<MediaAsset | null> {
  return db.get<MediaAsset>("SELECT * FROM media_assets WHERE id = $1", [id]);
}

export async function list(
  workspaceId: number,
  filters: ListFilters = {}
): Promise<{ items: MediaAsset[]; total: number }> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 24;
  const offset = (page - 1) * limit;

  const conditions: string[] = ["workspace_id = $1"];
  const params: any[] = [workspaceId];
  let paramIndex = 2;

  const archived = filters.archived ?? 0;
  conditions.push(`is_archived = $${paramIndex}`);
  params.push(archived);
  paramIndex++;

  if (filters.type) {
    conditions.push(`file_type = $${paramIndex}`);
    params.push(filters.type);
    paramIndex++;
  }

  if (filters.search) {
    conditions.push(`name ILIKE $${paramIndex}`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.tags) {
    conditions.push(`tags ILIKE $${paramIndex}`);
    params.push(`%${filters.tags}%`);
    paramIndex++;
  }

  const where = conditions.join(" AND ");

  const countResult = await db.get<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM media_assets WHERE ${where}`,
    params
  );
  const total = countResult?.total ?? 0;

  const items = await db.all<MediaAsset>(
    `SELECT * FROM media_assets WHERE ${where}
     ORDER BY created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return { items, total };
}

export async function update(
  id: number,
  data: Partial<{
    name: string;
    description: string;
    tags: string;
    bunny_status: string;
    url: string;
    duration: number;
  }>
): Promise<MediaAsset | null> {
  const { clause, values, nextParam } = buildSetClause(data, 1);
  if (!clause) return findById(id);

  await db.run(
    `UPDATE media_assets SET ${clause}, updated_at = NOW() WHERE id = $${nextParam}`,
    [...values, id]
  );
  return findById(id);
}

export async function archive(id: number): Promise<void> {
  await db.run(
    "UPDATE media_assets SET is_archived = 1, updated_at = NOW() WHERE id = $1",
    [id]
  );
}

export async function restore(id: number): Promise<void> {
  await db.run(
    "UPDATE media_assets SET is_archived = 0, updated_at = NOW() WHERE id = $1",
    [id]
  );
}

export async function hardDelete(id: number): Promise<void> {
  await db.run("DELETE FROM media_assets WHERE id = $1", [id]);
}

export async function getStorageStats(
  workspaceId: number
): Promise<{ file_type: string; count: number; total_size: number }[]> {
  return db.all(
    `SELECT file_type, COUNT(*)::int AS count, COALESCE(SUM(size), 0)::bigint AS total_size
     FROM media_assets
     WHERE workspace_id = $1 AND is_archived = 0
     GROUP BY file_type`,
    [workspaceId]
  );
}

export async function findByBunnyId(
  bunnyVideoId: string
): Promise<MediaAsset | null> {
  return db.get<MediaAsset>(
    "SELECT * FROM media_assets WHERE bunny_video_id = $1",
    [bunnyVideoId]
  );
}
