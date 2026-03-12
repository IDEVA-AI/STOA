import Database from "better-sqlite3";
import path from "path";

const dbPath = process.env.DB_PATH || process.env.DATABASE_PATH || path.join(process.cwd(), "nexus.db");
const db = new Database(dbPath);

export default db;
