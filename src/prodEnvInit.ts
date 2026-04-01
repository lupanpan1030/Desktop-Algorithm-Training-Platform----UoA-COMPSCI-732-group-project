import fs from "fs/promises";
import path from "path";
import { app } from "electron";

export async function initProdEnv() {
  const userDbPath = path.join(app.getPath("userData"), "dev.db");
  const packagedSeedPath = path.join(process.resourcesPath, "seed.db");

  await fs.mkdir(path.dirname(userDbPath), { recursive: true });

  try {
    await fs.access(userDbPath);
  } catch {
    await fs.copyFile(packagedSeedPath, userDbPath);
  }

  process.env.DATABASE_URL = "file:" + userDbPath;

  // Prisma engine binary paths
  if (process.platform === 'linux') {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(
      process.resourcesPath,
      "app.asar.unpacked",
      ".webpack",
      "main",
      "native_modules",
      "client",
      "libquery_engine-debian-openssl-3.0.x.so.node"
    );
  }
  if (process.platform === 'win32') {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(
      process.resourcesPath,
      "app.asar.unpacked",
      ".webpack",
      "main",
      "native_modules",
      "client",
      "query_engine-windows.dll.node"
    );
  }
  if (process.platform === 'darwin') {
    const libName = process.arch === 'arm64'
      ? "libquery_engine-darwin-arm64.dylib.node"
      : "libquery_engine-darwin.dylib.node";
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(
      process.resourcesPath,
      "app.asar.unpacked",
      ".webpack",
      "main",
      "native_modules",
      "client",
      libName
    );
  }
}
