import 'dotenv/config';
import crypto from 'crypto';
import { createApp } from './app';
import { initializeDatabase } from '../db/prisma/initialize-database';
import {
  DEFAULT_BACKEND_HOST,
  LOCAL_API_AUTH_TOKEN_ENV,
  normalizeBackendPort,
} from '../../shared/backendConfig';

function ensureLocalApiAuthToken() {
  const existingToken = process.env[LOCAL_API_AUTH_TOKEN_ENV]?.trim();
  if (existingToken) {
    return existingToken;
  }

  const token = crypto.randomBytes(32).toString("hex");
  process.env[LOCAL_API_AUTH_TOKEN_ENV] = token;
  console.log(
    `Generated ${LOCAL_API_AUTH_TOKEN_ENV} for this standalone backend process.`
  );
  return token;
}

async function main() {
  ensureLocalApiAuthToken();
  await initializeDatabase();
  const app = await createApp();
  const port = normalizeBackendPort(process.env.PORT);
  app.listen(port, DEFAULT_BACKEND_HOST, () => {
    console.log(`Server listening on ${DEFAULT_BACKEND_HOST}:${port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
