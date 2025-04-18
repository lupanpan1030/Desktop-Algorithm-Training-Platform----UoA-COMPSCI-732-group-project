// src/server.ts
import { createApp } from './app';
import { initializeDatabase } from '../db/prisma/initialize-database';

async function main() {
  await initializeDatabase();         // prepare your real DB
  const app = await createApp();
  const port = process.env.PORT || 6785;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
