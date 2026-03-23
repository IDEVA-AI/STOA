import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export const db = {
  async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const { rows } = await pool.query(sql, params);
    return (rows[0] as T) ?? null;
  },
  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const { rows } = await pool.query(sql, params);
    return rows as T[];
  },
  async run(sql: string, params: any[] = []): Promise<{ rowCount: number; rows: any[] }> {
    const { rowCount, rows } = await pool.query(sql, params);
    return { rowCount: rowCount ?? 0, rows };
  },
  async transaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
  async exec(sql: string): Promise<void> {
    await pool.query(sql);
  },
  pool,
};

export default db;
