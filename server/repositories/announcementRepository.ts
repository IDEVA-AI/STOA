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

export function getAll() {
  return db
    .prepare(
      `SELECT a.*, COUNT(b.id) as block_count
       FROM announcements a
       LEFT JOIN announcement_blocks b ON b.announcement_id = a.id
       GROUP BY a.id
       ORDER BY a.created_at DESC`
    )
    .all();
}

export function getById(id: number) {
  const announcement = db
    .prepare("SELECT * FROM announcements WHERE id = ?")
    .get(id) as AnnouncementRow | undefined;

  if (!announcement) return null;

  const blocks = db
    .prepare(
      `SELECT * FROM announcement_blocks WHERE announcement_id = ? ORDER BY "order" ASC`
    )
    .all(id) as BlockRow[];

  return { ...announcement, blocks };
}

export function create(data: AnnouncementInput) {
  const insertAnnouncement = db.prepare(`
    INSERT INTO announcements (title, type, priority, frequency, target, is_active, expires_at)
    VALUES (@title, @type, @priority, @frequency, @target, @is_active, @expires_at)
  `);

  const insertBlock = db.prepare(`
    INSERT INTO announcement_blocks (announcement_id, block_type, content, "order")
    VALUES (@announcement_id, @block_type, @content, @order)
  `);

  const transaction = db.transaction((data: AnnouncementInput) => {
    const result = insertAnnouncement.run({
      title: data.title,
      type: data.type ?? "info",
      priority: data.priority ?? 0,
      frequency: data.frequency ?? "once",
      target: data.target ?? "all",
      is_active: data.is_active ?? 1,
      expires_at: data.expires_at ?? null,
    });

    const announcementId = result.lastInsertRowid;

    if (data.blocks) {
      for (const block of data.blocks) {
        insertBlock.run({
          announcement_id: announcementId,
          block_type: block.block_type,
          content: block.content,
          order: block.order,
        });
      }
    }

    return getById(Number(announcementId));
  });

  return transaction(data);
}

export function update(id: number, data: AnnouncementInput) {
  const updateAnnouncement = db.prepare(`
    UPDATE announcements
    SET title = @title, type = @type, priority = @priority, frequency = @frequency,
        target = @target, is_active = @is_active, expires_at = @expires_at
    WHERE id = @id
  `);

  const deleteBlocks = db.prepare(
    "DELETE FROM announcement_blocks WHERE announcement_id = ?"
  );

  const insertBlock = db.prepare(`
    INSERT INTO announcement_blocks (announcement_id, block_type, content, "order")
    VALUES (@announcement_id, @block_type, @content, @order)
  `);

  const transaction = db.transaction((id: number, data: AnnouncementInput) => {
    updateAnnouncement.run({
      id,
      title: data.title,
      type: data.type ?? "info",
      priority: data.priority ?? 0,
      frequency: data.frequency ?? "once",
      target: data.target ?? "all",
      is_active: data.is_active ?? 1,
      expires_at: data.expires_at ?? null,
    });

    if (data.blocks) {
      deleteBlocks.run(id);
      for (const block of data.blocks) {
        insertBlock.run({
          announcement_id: id,
          block_type: block.block_type,
          content: block.content,
          order: block.order,
        });
      }
    }

    return getById(id);
  });

  return transaction(id, data);
}

export function remove(id: number) {
  // Delete confirmations first (no ON DELETE CASCADE on this FK)
  db.prepare("DELETE FROM announcement_confirmations WHERE announcement_id = ?").run(id);
  db.prepare("DELETE FROM announcement_blocks WHERE announcement_id = ?").run(id);
  db.prepare("DELETE FROM announcements WHERE id = ?").run(id);
}

export function getPendingForUser(userId: number) {
  const rows = db
    .prepare(
      `SELECT a.*
       FROM announcements a
       WHERE a.is_active = 1
         AND (a.expires_at IS NULL OR a.expires_at > datetime('now'))
         AND a.id NOT IN (
           SELECT announcement_id FROM announcement_confirmations WHERE user_id = ?
         )
       ORDER BY a.priority DESC`
    )
    .all(userId) as AnnouncementRow[];

  // Attach blocks for each pending announcement
  const getBlocks = db.prepare(
    `SELECT * FROM announcement_blocks WHERE announcement_id = ? ORDER BY "order" ASC`
  );

  return rows.map((row) => ({
    ...row,
    blocks: getBlocks.all(row.id) as BlockRow[],
  }));
}

export function confirm(announcementId: number, userId: number) {
  return db
    .prepare(
      `INSERT OR IGNORE INTO announcement_confirmations (announcement_id, user_id)
       VALUES (?, ?)`
    )
    .run(announcementId, userId);
}
