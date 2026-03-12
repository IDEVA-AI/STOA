import db from "../db/connection";

function parseContent(row: any) {
  if (!row) return row;
  try {
    row.content = JSON.parse(row.content);
  } catch {
    row.content = {};
  }
  return row;
}

export function getByLesson(lessonId: number) {
  const rows = db
    .prepare("SELECT * FROM lesson_blocks WHERE lesson_id = ? ORDER BY position ASC")
    .all(lessonId) as any[];
  return rows.map(parseContent);
}

export function getById(id: number) {
  const row = db.prepare("SELECT * FROM lesson_blocks WHERE id = ?").get(id);
  return parseContent(row);
}

export function create(data: {
  lesson_id: number;
  block_type: string;
  content: object;
  position: number;
}) {
  const result = db
    .prepare(
      "INSERT INTO lesson_blocks (lesson_id, block_type, content, position) VALUES (?, ?, ?, ?)"
    )
    .run(data.lesson_id, data.block_type, JSON.stringify(data.content), data.position);
  return { id: result.lastInsertRowid };
}

export function update(
  id: number,
  data: Partial<{ block_type: string; content: object; position: number }>
) {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.block_type !== undefined) {
    fields.push("block_type = ?");
    values.push(data.block_type);
  }
  if (data.content !== undefined) {
    fields.push("content = ?");
    values.push(JSON.stringify(data.content));
  }
  if (data.position !== undefined) {
    fields.push("position = ?");
    values.push(data.position);
  }

  if (fields.length === 0) return;

  values.push(id);
  db.prepare(`UPDATE lesson_blocks SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function remove(id: number) {
  db.prepare("DELETE FROM lesson_blocks WHERE id = ?").run(id);
}

export function removeByLesson(lessonId: number) {
  db.prepare("DELETE FROM lesson_blocks WHERE lesson_id = ?").run(lessonId);
}

export function reorder(lessonId: number, blockIds: number[]) {
  const tx = db.transaction(() => {
    const stmt = db.prepare(
      "UPDATE lesson_blocks SET position = ? WHERE id = ? AND lesson_id = ?"
    );
    blockIds.forEach((blockId, index) => {
      stmt.run(index, blockId, lessonId);
    });
  });
  tx();
}

export function setBlocks(
  lessonId: number,
  blocks: { block_type: string; content: object; position: number }[]
) {
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM lesson_blocks WHERE lesson_id = ?").run(lessonId);
    const insert = db.prepare(
      "INSERT INTO lesson_blocks (lesson_id, block_type, content, position) VALUES (?, ?, ?, ?)"
    );
    const ids: number[] = [];
    blocks.forEach((block, index) => {
      const result = insert.run(
        lessonId,
        block.block_type,
        JSON.stringify(block.content),
        block.position ?? index
      );
      ids.push(Number(result.lastInsertRowid));
    });
    return ids;
  });
  return tx();
}
