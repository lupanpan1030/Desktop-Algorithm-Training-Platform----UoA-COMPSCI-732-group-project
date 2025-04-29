// Generates the Prisma client and runs a seed initialization script if the database file not exists

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export function initializeDatabase() {
  const dbFilePath = path.join(__dirname, "dev.db");

  if (!fs.existsSync(dbFilePath)) {
    console.log("Database file not found. Initializing...");
    try {
      // Generate the Prisma client
      execSync("npx prisma migrate dev --schema=src/backend/db/prisma/schema.prisma", { stdio: "inherit" });

      // Run seed initialization script
      execSync("npx ts-node src/backend/db/seeds/init-db_first.ts", {
        stdio: "inherit",
      });
    } catch (error) {
      console.error("Database initialization failed:", error);
    }
  }
}
