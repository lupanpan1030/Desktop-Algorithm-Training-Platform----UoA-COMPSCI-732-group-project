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
}
