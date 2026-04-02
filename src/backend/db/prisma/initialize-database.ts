import fs from "fs/promises";
import path from "path";
import {
  fromSqliteFileUrl,
  syncSqliteDatabase,
  toSqliteFileUrl,
} from "./bootstrap-sqlite";

function resolveDatabasePath() {
  const configuredUrl = process.env.DATABASE_URL;

  if (configuredUrl) {
    return fromSqliteFileUrl(configuredUrl);
  }

  return path.resolve(process.cwd(), "dev.db");
}

export async function initializeDatabase() {
  const dbFilePath = resolveDatabasePath();

  process.env.DATABASE_URL = toSqliteFileUrl(dbFilePath);

  let isFreshDatabase = false;
  try {
    await fs.access(dbFilePath);
  } catch {
    isFreshDatabase = true;
    console.log("Database file not found. Initializing...");
  }

  const syncResult = await syncSqliteDatabase(dbFilePath);
  if (!isFreshDatabase && syncResult.changed) {
    console.log("Database schema updated to match the current Prisma schema.");
  }

  if (syncResult.created) {
    const { seedFreshDatabase } = await import("../seeds/init-db_first");
    await seedFreshDatabase();
  }
}
