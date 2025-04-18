import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';

let backendProcess: ChildProcess | undefined;

export function startBackend(): void {
  if (process.env.NODE_ENV === 'development') {
    backendProcess = spawn('ts-node-dev', ['--respawn', 'src/backend/api/server.ts'], {
      shell: true,
      stdio: 'inherit',
    });
    process.on('exit', () => {
      if (backendProcess) backendProcess.kill();
    });
    ['SIGINT', 'SIGTERM'].forEach(signal => {
      process.on(signal, () => {
        if (backendProcess) backendProcess.kill();
        process.exit();
      });
    });
  }
}

export function waitForBackend(): Promise<void> {
  const url = 'http://localhost:6785/problems';
  return new Promise(resolve => {
    const interval = setInterval(() => {
      http.get(url, res => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve();
        }
      }).on('error', () => {
        // ...ignore errors until backend is ready...
      });
    }, 500);
  });
}
