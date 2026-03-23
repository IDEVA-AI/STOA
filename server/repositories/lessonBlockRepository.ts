import db from "../db/connection";

function parseContent(row: any) {
  if (!row) return row;
  row.content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
  return row;
}

export async function getByLesson(lessonId: number) {
  const rows = await db.all(
    "SELECT * FROM lesson_blocks WHERE lesson_id = $1 ORDER BY position ASC",
    [lessonId]
  );
  return rows.map(parseContent);
}

export async function getById(id: number) {
  const row = await db.get("SELECT * FROM lesson_blocks WHERE id = $1", [id]);
  return parseContent(row);
}

export async function create(data: {
  lesson_id: number;
  block_type: string;
  content: object;
  position: number;
}): Promise<{ id: number }> {
  const result = await db.run(
    "INSERT INTO lesson_blocks (lesson_id, block_type, content, position) VALUES ($1, $2, $3, $4) RETURNING id",
    [data.lesson_id, data.block_type, JSON.stringify(data.content), data.position]
  );
  return { id: result.rows[0].id };
}

export async function update(
  id: number,
  data: Partial<{ block_type: string; content: object; position: number }>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.block_type !== undefined) {
    fields.push(`block_type = $${paramIndex}`);
    values.push(data.block_type);
    paramIndex++;
  }
  if (data.content !== undefined) {
    fields.push(`content = $${paramIndex}`);
    values.push(JSON.stringify(data.content));
    paramIndex++;
  }
  if (data.position !== undefined) {
    fields.push(`position = $${paramIndex}`);
    values.push(data.position);
    paramIndex++;
  }

  if (fields.length === 0) return;

  values.push(id);
  await db.run(`UPDATE lesson_blocks SET ${fields.join(", ")} WHERE id = $${paramIndex}`, values);
}

export async function remove(id: number): Promise<void> {
  await db.run("DELETE FROM lesson_blocks WHERE id = $1", [id]);
}

export async function removeByLesson(lessonId: number): Promise<void> {
  await db.run("DELETE FROM lesson_blocks WHERE lesson_id = $1", [lessonId]);
}

export async function reorder(lessonId: number, blockIds: number[]): Promise<void> {
  await db.transaction(async (client) => {
    for (let index = 0; index < blockIds.length; index++) {
      await client.query(
        "UPDATE lesson_blocks SET position = $1 WHERE id = $2 AND lesson_id = $3",
        [index, blockIds[index], lessonId]
      );
    }
  });
}

export async function setBlocks(
  lessonId: number,
  blocks: { block_type: string; content: object; position: number }[]
): Promise<number[]> {
  return db.transaction(async (client) => {
    await client.query("DELETE FROM lesson_blocks WHERE lesson_id = $1", [lessonId]);
    const ids: number[] = [];
    for (let index = 0; index < blocks.length; index++) {
      const block = blocks[index];
      const result = await client.query(
        "INSERT INTO lesson_blocks (lesson_id, block_type, content, position) VALUES ($1, $2, $3, $4) RETURNING id",
        [lessonId, block.block_type, JSON.stringify(block.content), block.position ?? index]
      );
      ids.push(result.rows[0].id);
    }
    return ids;
  });
}
