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
      // Fallback: drop all data and reseed using the full-reset script
      console.log("Retrying with full reset (drop & reseed)...");
      try {
        execSync("npx ts-node src/backend/db/seeds/init-db+drop.ts", { stdio: "inherit" });
        console.log("Database reset and reseeded successfully.");
      } catch (resetError) {
        console.error("Fallback reseed failed:", resetError);
        // Re‑throw to propagate failure if needed
        throw resetError;
      }
    }
  }
}
