import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';
import 'dotenv/config';
import { createApp } from './backend/api/app';
import { initializeDatabase } from './backend/db/prisma/initialize-database';
import { buildBackendBaseUrl, normalizeBackendPort } from './shared/backendConfig';
import { StartupFailure } from './startupFailure';

let backendProcess: ChildProcess | undefined;
let directServerInstance: http.Server | undefined;
let cleanupRegistered = false;
const DEFAULT_BACKEND_START_TIMEOUT_MS =
  process.env.NODE_ENV === 'development' ? 90000 : 30000;
const MAX_BACKEND_LOG_LINES = 12;
let recentBackendLogLines: string[] = [];

function getBackendPort() {
  return normalizeBackendPort(process.env.PORT);
}

function getBackendStartTimeoutMs() {
  const rawTimeout = process.env.BACKEND_START_TIMEOUT_MS?.trim();
  const parsedTimeout = rawTimeout
    ? Number.parseInt(rawTimeout, 10)
    : DEFAULT_BACKEND_START_TIMEOUT_MS;

  if (Number.isInteger(parsedTimeout) && parsedTimeout >= 1000) {
    return parsedTimeout;
  }

  return DEFAULT_BACKEND_START_TIMEOUT_MS;
}

function resetBackendStartupLog() {
  recentBackendLogLines = [];
}

function appendBackendStartupLog(chunk: Buffer | string) {
  const text = chunk.toString();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return;
  }

  recentBackendLogLines.push(...lines);
  if (recentBackendLogLines.length > MAX_BACKEND_LOG_LINES) {
    recentBackendLogLines = recentBackendLogLines.slice(-MAX_BACKEND_LOG_LINES);
  }
}

function getRecentBackendStartupLog() {
  return recentBackendLogLines.join("\n");
}

function registerCleanupHandlers() {
  if (cleanupRegistered) {
    return;
  }

  cleanupRegistered = true;

  process.on('exit', () => {
    if (backendProcess) backendProcess.kill();
    if (directServerInstance) directServerInstance.close();
  });

  ['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, () => {
      if (backendProcess) backendProcess.kill();
      if (directServerInstance) directServerInstance.close();
      process.exit();
    });
  });
}

// Function to directly start the backend server (equivalent to main in server.ts)
async function startBackendDirectly(): Promise<void> {
  await initializeDatabase();
  const expressApp = await createApp();
  const port = getBackendPort();

  await new Promise<void>((resolve, reject) => {
    const server = expressApp.listen(port);

    server.once('listening', () => {
      directServerInstance = server;
      console.log(`Server directly started on port ${port}`);
      resolve();
    });
    server.once('error', reject);
  });
}

export async function startBackend(): Promise<void> {
  registerCleanupHandlers();
  resetBackendStartupLog();

  if (process.env.NODE_ENV === 'development') {
    // Development mode - use ts-node-dev
    await new Promise<void>((resolve, reject) => {
      backendProcess = spawn('ts-node-dev', ['--respawn', 'src/backend/api/server.ts'], {
        shell: true,
        stdio: ['inherit', 'pipe', 'pipe'],
      });

      backendProcess.stdout?.on('data', chunk => {
        process.stdout.write(chunk);
        appendBackendStartupLog(chunk);
      });
      backendProcess.stderr?.on('data', chunk => {
        process.stderr.write(chunk);
        appendBackendStartupLog(chunk);
      });
      backendProcess.once('spawn', () => resolve());
      backendProcess.once('error', reject);
    });
  } else {
    // Production mode - directly call the server function
    console.log('Starting backend server directly in production mode');
    await startBackendDirectly();
  }
}

export function waitForBackend(timeoutMs = getBackendStartTimeoutMs()): Promise<void> {
  const url = `${buildBackendBaseUrl(getBackendPort())}/problems`;

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    console.log(`Waiting for backend readiness at ${url} (timeout ${timeoutMs}ms)...`);
    const handleBackendExit = (code: number | null, signal: NodeJS.Signals | null) => {
      clearInterval(interval);
      reject(
        new StartupFailure(
          'backend_exit',
          `Backend process exited before becoming ready (code=${code ?? 'unknown'}, signal=${signal ?? 'none'}).`,
          getRecentBackendStartupLog()
        )
      );
    };

    backendProcess?.once('exit', handleBackendExit);

    const cleanup = () => {
      clearInterval(interval);
      backendProcess?.off('exit', handleBackendExit);
    };

    const poll = () => {
      http
        .get(url, res => {
          if (res.statusCode === 200) {
            cleanup();
            console.log(`Backend became ready after ${Date.now() - startedAt}ms.`);
            resolve();
            return;
          }

          res.resume();
        })
        .on('error', () => {
          // Ignore connection errors until the timeout expires.
        });

      if (Date.now() - startedAt >= timeoutMs) {
        cleanup();
        reject(
          new StartupFailure(
            'backend_timeout',
            `Backend did not become ready within ${timeoutMs}ms at ${url}.`,
            getRecentBackendStartupLog()
          )
        );
      }
    };

    const interval = setInterval(poll, 500);
    poll();
  });
}
