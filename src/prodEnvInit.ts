import path from 'path';

export function initProdEnv() {
    // SQLite database path
    process.env.DATABASE_URL = "file:" + path.join(
        process.resourcesPath,
        "dev.db"
    );

  // Prisma engine binary paths
  // Linux (Debian)
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
  // Windows
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
  // macOS
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
