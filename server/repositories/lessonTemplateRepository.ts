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

export async function getByWorkspace(workspaceId: number) {
  return db.all(
    `SELECT lt.*, COUNT(ltb.id) as block_count
     FROM lesson_templates lt
     LEFT JOIN lesson_template_blocks ltb ON ltb.template_id = lt.id
     WHERE lt.workspace_id = $1
     GROUP BY lt.id
     ORDER BY lt.is_default DESC, lt.name ASC`,
    [workspaceId]
  );
}

export async function getById(id: number) {
  const template = await db.get<any>(
    "SELECT * FROM lesson_templates WHERE id = $1",
    [id]
  );
  if (!template) return null;
  template.blocks = await getBlocks(id);
  return template;
}

export async function create(data: {
  workspace_id: number;
  name: string;
  description?: string;
  thumbnail?: string;
  is_default?: number;
}): Promise<{ id: number }> {
  const result = await db.run(
    "INSERT INTO lesson_templates (workspace_id, name, description, thumbnail, is_default) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [
      data.workspace_id,
      data.name,
      data.description ?? null,
      data.thumbnail ?? null,
      data.is_default ?? 0,
    ]
  );
  return { id: result.rows[0].id };
}

export async function update(
  id: number,
  data: Partial<{
    name: string;
    description: string;
    thumbnail: string;
    is_default: number;
  }>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }
  if (data.thumbnail !== undefined) {
    fields.push(`thumbnail = $${paramIndex++}`);
    values.push(data.thumbnail);
  }
  if (data.is_default !== undefined) {
    fields.push(`is_default = $${paramIndex++}`);
    values.push(data.is_default);
  }

  if (fields.length === 0) return;

  values.push(id);
  await db.run(
    `UPDATE lesson_templates SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
    values
  );
}

export async function remove(id: number): Promise<void> {
  await db.run("DELETE FROM lesson_templates WHERE id = $1", [id]);
}

export async function getBlocks(templateId: number) {
  const rows = await db.all<any>(
    "SELECT * FROM lesson_template_blocks WHERE template_id = $1 ORDER BY position ASC",
    [templateId]
  );
  return rows.map(parseContent);
}

export async function setBlocks(
  templateId: number,
  blocks: { block_type: string; content: object; position: number }[]
): Promise<void> {
  await db.transaction(async (client) => {
    await client.query(
      "DELETE FROM lesson_template_blocks WHERE template_id = $1",
      [templateId]
    );
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      await client.query(
        "INSERT INTO lesson_template_blocks (template_id, block_type, content, position) VALUES ($1, $2, $3, $4)",
        [templateId, block.block_type, JSON.stringify(block.content), block.position ?? i]
      );
    }
  });
}

export async function createFromLesson(
  workspaceId: number,
  lessonId: number,
  name: string
): Promise<{ id: number }> {
  const templateId = await db.transaction(async (client) => {
    const { rows: templateRows } = await client.query(
      "INSERT INTO lesson_templates (workspace_id, name) VALUES ($1, $2) RETURNING id",
      [workspaceId, name]
    );
    const newTemplateId = templateRows[0].id;

    const { rows: lessonBlocks } = await client.query(
      "SELECT block_type, content, position FROM lesson_blocks WHERE lesson_id = $1 ORDER BY position ASC",
      [lessonId]
    );

    for (const block of lessonBlocks) {
      await client.query(
        "INSERT INTO lesson_template_blocks (template_id, block_type, content, position) VALUES ($1, $2, $3, $4)",
        [newTemplateId, block.block_type, block.content, block.position]
      );
    }

    return newTemplateId;
  });
  return { id: templateId as number };
}

export async function getDefaults(workspaceId: number) {
  return db.all(
    "SELECT * FROM lesson_templates WHERE workspace_id = $1 AND is_default = 1 ORDER BY name ASC",
    [workspaceId]
  );
}
