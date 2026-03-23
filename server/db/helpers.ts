/**
 * Builds a dynamic SET clause for UPDATE queries with PostgreSQL positional params.
 *
 * Usage:
 *   const { clause, values, nextParam } = buildSetClause({ name: "John", bio: "Hi" }, 1);
 *   // clause: '"name" = $1, "bio" = $2'
 *   // values: ["John", "Hi"]
 *   // nextParam: 3
 *   await db.run(`UPDATE users SET ${clause} WHERE id = $${nextParam}`, [...values, userId]);
 */
export function buildSetClause(
  data: Record<string, any>,
  startAt = 1
): { clause: string; values: any[]; nextParam: number } {
  const fields: string[] = [];
  const values: any[] = [];
  let i = startAt;
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      fields.push(`"${key}" = $${i}`);
      values.push(val);
      i++;
    }
  }
  return { clause: fields.join(", "), values, nextParam: i };
}
