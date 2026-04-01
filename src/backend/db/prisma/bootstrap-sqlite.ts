import { execFileSync } from "child_process";
import fs from "fs/promises";
import path from "path";
import sqlite3 from "sqlite3";

const NPX_COMMAND = process.platform === "win32" ? "npx.cmd" : "npx";

export function getSchemaPath() {
  return path.resolve(process.cwd(), "src/backend/db/prisma/schema.prisma");
}

export function toSqliteFileUrl(dbPath: string) {
  return `file:${dbPath}`;
}

export function generateSchemaSql(schemaPath = getSchemaPath()) {
  return execFileSync(
    NPX_COMMAND,
    [
      "prisma",
      "migrate",
      "diff",
      "--from-empty",
      "--to-schema-datamodel",
      schemaPath,
      "--script",
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        PRISMA_HIDE_UPDATE_MESSAGE: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
}

export async function applySqlToSqlite(dbPath: string, sql: string) {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });

  await new Promise<void>((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (openError) => {
      if (openError) {
        reject(openError);
        return;
      }

      db.exec(sql, (execError) => {
        db.close((closeError) => {
          if (execError) {
            reject(execError);
            return;
          }
          if (closeError) {
            reject(closeError);
            return;
          }
          resolve();
        });
      });
    });
  });
}

export async function bootstrapSqliteDatabase(
  dbPath: string,
  schemaPath = getSchemaPath()
) {
  const sql = generateSchemaSql(schemaPath);
  await applySqlToSqlite(dbPath, sql);
}
