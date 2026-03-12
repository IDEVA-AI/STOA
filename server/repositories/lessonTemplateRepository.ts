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

export function getByWorkspace(workspaceId: number) {
  return db
    .prepare(
      `SELECT lt.*, COUNT(ltb.id) as block_count
       FROM lesson_templates lt
       LEFT JOIN lesson_template_blocks ltb ON ltb.template_id = lt.id
       WHERE lt.workspace_id = ?
       GROUP BY lt.id
       ORDER BY lt.is_default DESC, lt.name ASC`
    )
    .all(workspaceId);
}

export function getById(id: number) {
  const template = db
    .prepare("SELECT * FROM lesson_templates WHERE id = ?")
    .get(id) as any;
  if (!template) return null;
  template.blocks = getBlocks(id);
  return template;
}

export function create(data: {
  workspace_id: number;
  name: string;
  description?: string;
  thumbnail?: string;
  is_default?: number;
}) {
  const result = db
    .prepare(
      "INSERT INTO lesson_templates (workspace_id, name, description, thumbnail, is_default) VALUES (?, ?, ?, ?, ?)"
    )
    .run(
      data.workspace_id,
      data.name,
      data.description ?? null,
      data.thumbnail ?? null,
      data.is_default ?? 0
    );
  return { id: Number(result.lastInsertRowid) };
}

export function update(
  id: number,
  data: Partial<{
    name: string;
    description: string;
    thumbnail: string;
    is_default: number;
  }>
) {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.description !== undefined) {
    fields.push("description = ?");
    values.push(data.description);
  }
  if (data.thumbnail !== undefined) {
    fields.push("thumbnail = ?");
    values.push(data.thumbnail);
  }
  if (data.is_default !== undefined) {
    fields.push("is_default = ?");
    values.push(data.is_default);
  }

  if (fields.length === 0) return;

  values.push(id);
  db.prepare(`UPDATE lesson_templates SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values
  );
}

export function remove(id: number) {
  db.prepare("DELETE FROM lesson_templates WHERE id = ?").run(id);
}

export function getBlocks(templateId: number) {
  const rows = db
    .prepare(
      "SELECT * FROM lesson_template_blocks WHERE template_id = ? ORDER BY position ASC"
    )
    .all(templateId) as any[];
  return rows.map(parseContent);
}

export function setBlocks(
  templateId: number,
  blocks: { block_type: string; content: object; position: number }[]
) {
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM lesson_template_blocks WHERE template_id = ?").run(
      templateId
    );
    const insert = db.prepare(
      "INSERT INTO lesson_template_blocks (template_id, block_type, content, position) VALUES (?, ?, ?, ?)"
    );
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      insert.run(
        templateId,
        block.block_type,
        JSON.stringify(block.content),
        block.position ?? i
      );
    }
  });
  tx();
}

export function createFromLesson(
  workspaceId: number,
  lessonId: number,
  name: string
) {
  const tx = db.transaction(() => {
    const result = db
      .prepare(
        "INSERT INTO lesson_templates (workspace_id, name) VALUES (?, ?)"
      )
      .run(workspaceId, name);
    const templateId = Number(result.lastInsertRowid);

    const lessonBlocks = db
      .prepare(
        "SELECT block_type, content, position FROM lesson_blocks WHERE lesson_id = ? ORDER BY position ASC"
      )
      .all(lessonId) as any[];

    const insert = db.prepare(
      "INSERT INTO lesson_template_blocks (template_id, block_type, content, position) VALUES (?, ?, ?, ?)"
    );
    for (const block of lessonBlocks) {
      insert.run(templateId, block.block_type, block.content, block.position);
    }

    return templateId;
  });
  return { id: tx() as number };
}

export function getDefaults(workspaceId: number) {
  return db
    .prepare(
      "SELECT * FROM lesson_templates WHERE workspace_id = ? AND is_default = 1 ORDER BY name ASC"
    )
    .all(workspaceId);
}
