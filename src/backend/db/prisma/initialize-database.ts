import fs from "fs/promises";
import path from "path";
import {
  bootstrapSqliteDatabase,
  toSqliteFileUrl,
} from "./bootstrap-sqlite";

export async function initializeDatabase() {
  const dbFilePath = path.resolve(process.cwd(), "dev.db");

  process.env.DATABASE_URL = toSqliteFileUrl(dbFilePath);

  try {
    await fs.access(dbFilePath);
    return;
  } catch {
    console.log("Database file not found. Initializing...");
  }

  await bootstrapSqliteDatabase(dbFilePath);

  const { seedFreshDatabase } = await import("../seeds/init-db_first");
  await seedFreshDatabase();
}
