// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import {
  buildBackendBaseUrl,
  LOCAL_API_AUTH_TOKEN_ARG_PREFIX,
  LOCAL_API_AUTH_TOKEN_ENV,
  normalizeBackendPort,
} from './shared/backendConfig';

const backendPort = normalizeBackendPort(process.env.PORT);
const backendBaseUrl = buildBackendBaseUrl(backendPort);
const backendAuthToken =
  process.argv
    .find((argument) => argument.startsWith(LOCAL_API_AUTH_TOKEN_ARG_PREFIX))
    ?.slice(LOCAL_API_AUTH_TOKEN_ARG_PREFIX.length)
    .trim() ||
  process.env[LOCAL_API_AUTH_TOKEN_ENV]?.trim() ||
  "";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  backendPort,
  backendBaseUrl,
  backendAuthToken,
  send: (channel: string, data: any) => {
    // whitelist channels
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel: string, func: (...args: any[]) => void) => {
    const validChannels = ['fromMain'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
});
