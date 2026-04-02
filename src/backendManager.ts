import { spawn, ChildProcess } from 'child_process';
import * as http from 'http';
import 'dotenv/config';
import { createApp } from './backend/api/app';
import { initializeDatabase } from './backend/db/prisma/initialize-database';

let backendProcess: ChildProcess | undefined;
let directServerInstance: http.Server | undefined;

// Function to directly start the backend server (equivalent to main in server.ts)
async function startBackendDirectly(): Promise<void> {
  try {
    await initializeDatabase();
    const expressApp = await createApp();
    const port = process.env.PORT || 6785;

    directServerInstance = expressApp.listen(port, () => {
      console.log(`Server directly started on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start direct server:', err);
  }
}

export async function startBackend(): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    // Development mode - use ts-node-dev
    backendProcess = spawn('ts-node-dev', ['--respawn', 'src/backend/api/server.ts'], {
      shell: true,
      stdio: 'inherit',
    });
  } else {
    // Production mode - directly call the server function
    console.log('Starting backend server directly in production mode');
    await startBackendDirectly().catch(err => {
      console.error('Error starting backend directly:', err);
    });
  }

  // Handle process cleanup
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
