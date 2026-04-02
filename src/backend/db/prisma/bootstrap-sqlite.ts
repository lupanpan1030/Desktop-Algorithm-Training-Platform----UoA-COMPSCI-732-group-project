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

export function fromSqliteFileUrl(databaseUrl: string) {
  if (!databaseUrl.startsWith("file:")) {
    throw new Error(`Unsupported DATABASE_URL "${databaseUrl}". Expected a sqlite file URL.`);
  }

  const rawPath = databaseUrl.slice("file:".length);
  return path.isAbsolute(rawPath)
    ? rawPath
    : path.resolve(process.cwd(), rawPath);
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

export function generateSchemaDiffSql(
  fromDatabaseUrl: string,
  schemaPath = getSchemaPath()
) {
  return execFileSync(
    NPX_COMMAND,
    [
      "prisma",
      "migrate",
      "diff",
      "--from-url",
      fromDatabaseUrl,
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

export function isEmptyMigrationSql(sql: string) {
  return sql.trim() === "" || sql.includes("-- This is an empty migration.");
}

export async function bootstrapSqliteDatabase(
  dbPath: string,
  schemaPath = getSchemaPath()
) {
  const sql = generateSchemaSql(schemaPath);
  await applySqlToSqlite(dbPath, sql);
}

export async function syncSqliteDatabase(
  dbPath: string,
  schemaPath = getSchemaPath()
) {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });

  try {
    await fs.access(dbPath);
  } catch {
    await bootstrapSqliteDatabase(dbPath, schemaPath);
    return { created: true, changed: true };
  }

  const diffSql = generateSchemaDiffSql(toSqliteFileUrl(dbPath), schemaPath);
  if (isEmptyMigrationSql(diffSql)) {
    return { created: false, changed: false };
  }

  await applySqlToSqlite(dbPath, diffSql);
  return { created: false, changed: true };
}
