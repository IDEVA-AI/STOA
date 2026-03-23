/**
 * One-time migration script: SQLite (nexus.db) → PostgreSQL
 *
 * Usage: npx tsx scripts/migrate-sqlite-to-pg.ts
 *
 * Prerequisites:
 *   - SSH tunnel: ssh -L 5433:localhost:5432 root@178.156.252.78
 *   - .env with DATABASE_URL pointing to PG
 *   - nexus.db in project root
 */
import "dotenv/config";
import Database from "better-sqlite3";
import pg from "pg";
import path from "path";

const SQLITE_PATH = path.resolve(process.cwd(), "nexus.db");
const sqlite = new Database(SQLITE_PATH, { readonly: true });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Tables in FK-safe order (parents before children)
const MIGRATION_ORDER = [
  "users",
  "workspaces",
  "workspace_members",
  "courses",
  "modules",
  "lessons",
  "courses_modules",
  "modules_lessons",
  "products",
  "product_courses",
  "purchases",
  "communities",
  "community_categories",
  "posts",
  "post_comments",
  "post_likes",
  "conversations",
  "conversation_participants",
  "messages",
  "announcements",
  "announcement_blocks",
  "announcement_confirmations",
  "invite_codes",
  "invite_redemptions",
  "trails",
  "trails_courses",
  "availability_configs",
  "availability_slots",
  "bookings",
  "lesson_blocks",
  "lesson_templates",
  "lesson_template_blocks",
  "lesson_progress",
  "user_follows",
];

async function getPgColumns(client: pg.PoolClient, table: string): Promise<string[]> {
  const res = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public'`,
    [table]
  );
  return res.rows.map((r: any) => r.column_name);
}

async function migrateTable(client: pg.PoolClient, table: string) {
  // Read all rows from SQLite
  const rows = sqlite.prepare(`SELECT * FROM "${table}"`).all() as Record<string, any>[];
  if (rows.length === 0) {
    console.log(`  ${table}: 0 rows (skip)`);
    return 0;
  }

  // Get PG columns and filter SQLite columns to only those that exist in PG
  const pgCols = await getPgColumns(client, table);
  const allSqliteCols = Object.keys(rows[0]);
  const columns = allSqliteCols.filter(c => pgCols.includes(c));
  const skipped = allSqliteCols.filter(c => !pgCols.includes(c));
  if (skipped.length > 0) {
    console.log(`  ${table}: skipping columns not in PG: ${skipped.join(", ")}`);
  }

  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
  const colNames = columns.map(c => `"${c}"`).join(", ");
  const sql = `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

  let inserted = 0;
  for (const row of rows) {
    const values = columns.map(col => {
      const val = row[col];
      // Convert empty string timestamps to null for TIMESTAMPTZ columns
      if (val === "" && (col.endsWith("_at") || col === "expires_at")) return null;
      return val;
    });
    try {
      await client.query("SAVEPOINT row_sp");
      const result = await client.query(sql, values);
      inserted += result.rowCount ?? 0;
      await client.query("RELEASE SAVEPOINT row_sp");
    } catch (err: any) {
      await client.query("ROLLBACK TO SAVEPOINT row_sp");
      console.error(`  ERROR in ${table}: ${err.message}`);
      console.error(`  Row:`, JSON.stringify(row).slice(0, 200));
    }
  }

  console.log(`  ${table}: ${inserted}/${rows.length} rows`);
  return inserted;
}

async function resetSequences(client: pg.PoolClient) {
  console.log("\nResetting sequences...");
  for (const table of MIGRATION_ORDER) {
    try {
      // Check if table has a serial id column
      const seqName = `${table}_id_seq`;
      const maxId = await client.query(`SELECT COALESCE(MAX(id), 0) as max FROM "${table}"`);
      const nextVal = (maxId.rows[0].max as number) + 1;
      await client.query(`SELECT setval('${seqName}', $1, false)`, [nextVal]);
    } catch {
      // Table might not have a sequence (no serial id) — skip
    }
  }
  console.log("Sequences reset.");
}

async function main() {
  console.log(`Source: ${SQLITE_PATH}`);
  console.log(`Target: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@")}\n`);

  // Verify SQLite has data
  const userCount = sqlite.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  console.log(`SQLite users: ${userCount.c}\n`);

  if (userCount.c === 0) {
    console.log("SQLite is empty. Nothing to migrate.");
    process.exit(0);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Clear existing seed data first
    console.log("Clearing PG tables (reverse order)...");
    for (const table of [...MIGRATION_ORDER].reverse()) {
      await client.query(`DELETE FROM "${table}"`);
    }

    console.log("\nMigrating tables...");
    let total = 0;
    for (const table of MIGRATION_ORDER) {
      try {
        total += await migrateTable(client, table);
      } catch (err: any) {
        // Table might not exist in SQLite
        if (err.message.includes("no such table")) {
          console.log(`  ${table}: not in SQLite (skip)`);
        } else {
          throw err;
        }
      }
    }

    await resetSequences(client);
    await client.query("COMMIT");
    console.log(`\nMigration complete! ${total} total rows migrated.`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\nMigration FAILED, rolled back:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    sqlite.close();
  }
}

main();
