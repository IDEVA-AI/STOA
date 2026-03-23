import db from "../db/connection";

interface AnnouncementRow {
  id: number;
  title: string;
  type: string;
  priority: number;
  frequency: string;
  target: string;
  is_active: number;
  expires_at: string | null;
  created_at: string;
}

interface BlockRow {
  id: number;
  announcement_id: number;
  block_type: string;
  content: string;
  order: number;
}

interface BlockInput {
  block_type: string;
  content: string;
  order: number;
}

interface AnnouncementInput {
  title: string;
  type?: string;
  priority?: number;
  frequency?: string;
  target?: string;
  is_active?: number;
  expires_at?: string | null;
  blocks?: BlockInput[];
}

export async function getAll() {
  return db.all(
    `SELECT a.*, COUNT(b.id) as block_count
     FROM announcements a
     LEFT JOIN announcement_blocks b ON b.announcement_id = a.id
     GROUP BY a.id
     ORDER BY a.created_at DESC`
  );
}

export async function getById(id: number) {
  const announcement = await db.get<AnnouncementRow>(
    "SELECT * FROM announcements WHERE id = $1",
    [id]
  );

  if (!announcement) return null;

  const blocks = await db.all<BlockRow>(
    `SELECT * FROM announcement_blocks WHERE announcement_id = $1 ORDER BY "order" ASC`,
    [id]
  );

  return { ...announcement, blocks };
}

export async function create(data: AnnouncementInput) {
  return db.transaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO announcements (title, type, priority, frequency, target, is_active, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        data.title,
        data.type ?? "info",
        data.priority ?? 0,
        data.frequency ?? "once",
        data.target ?? "all",
        data.is_active ?? 1,
        data.expires_at ?? null,
      ]
    );

    const announcementId = rows[0].id;

    if (data.blocks) {
      for (const block of data.blocks) {
        await client.query(
          `INSERT INTO announcement_blocks (announcement_id, block_type, content, "order")
           VALUES ($1, $2, $3, $4)`,
          [announcementId, block.block_type, block.content, block.order]
        );
      }
    }

    return getById(Number(announcementId));
  });
}

export async function update(id: number, data: AnnouncementInput) {
  return db.transaction(async (client) => {
    await client.query(
      `UPDATE announcements
       SET title = $1, type = $2, priority = $3, frequency = $4,
           target = $5, is_active = $6, expires_at = $7
       WHERE id = $8`,
      [
        data.title,
        data.type ?? "info",
        data.priority ?? 0,
        data.frequency ?? "once",
        data.target ?? "all",
        data.is_active ?? 1,
        data.expires_at ?? null,
        id,
      ]
    );

    if (data.blocks) {
      await client.query(
        "DELETE FROM announcement_blocks WHERE announcement_id = $1",
        [id]
      );
      for (const block of data.blocks) {
        await client.query(
          `INSERT INTO announcement_blocks (announcement_id, block_type, content, "order")
           VALUES ($1, $2, $3, $4)`,
          [id, block.block_type, block.content, block.order]
        );
      }
    }

    return getById(id);
  });
}

export async function remove(id: number): Promise<void> {
  // Delete confirmations first (no ON DELETE CASCADE on this FK)
  await db.run("DELETE FROM announcement_confirmations WHERE announcement_id = $1", [id]);
  await db.run("DELETE FROM announcement_blocks WHERE announcement_id = $1", [id]);
  await db.run("DELETE FROM announcements WHERE id = $1", [id]);
}

export async function getPendingForUser(userId: number) {
  const rows = await db.all<AnnouncementRow>(
    `SELECT a.*
     FROM announcements a
     WHERE a.is_active = 1
       AND (a.expires_at IS NULL OR a.expires_at > NOW())
       AND a.id NOT IN (
         SELECT announcement_id FROM announcement_confirmations WHERE user_id = $1
       )
     ORDER BY a.priority DESC`,
    [userId]
  );

  // Attach blocks for each pending announcement
  const results = [];
  for (const row of rows) {
    const blocks = await db.all<BlockRow>(
      `SELECT * FROM announcement_blocks WHERE announcement_id = $1 ORDER BY "order" ASC`,
      [row.id]
    );
    results.push({ ...row, blocks });
  }

  return results;
}

export async function confirm(announcementId: number, userId: number) {
  return db.run(
    `INSERT INTO announcement_confirmations (announcement_id, user_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [announcementId, userId]
  );
}
