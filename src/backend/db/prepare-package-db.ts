import fs from "fs/promises";
import path from "path";
import {
  bootstrapSqliteDatabase,
  toSqliteFileUrl,
} from "./prisma/bootstrap-sqlite";

async function main() {
  const packageDbPath = path.resolve(process.cwd(), "build-resources", "seed.db");

  await fs.mkdir(path.dirname(packageDbPath), { recursive: true });
  await fs.rm(packageDbPath, { force: true });

  process.env.DATABASE_URL = toSqliteFileUrl(packageDbPath);

  await bootstrapSqliteDatabase(packageDbPath);

  const { seedFreshDatabase } = await import("./seeds/init-db_first");
  await seedFreshDatabase();

  console.log(`Packaged seed database created at ${packageDbPath}`);
}

main().catch((error) => {
  console.error("Failed to prepare packaged seed database:", error);
  process.exit(1);
});
