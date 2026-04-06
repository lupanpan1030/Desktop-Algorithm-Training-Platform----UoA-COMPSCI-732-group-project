import axios from 'axios';
import { buildBackendBaseUrl, DEFAULT_BACKEND_PORT } from '../../shared/backendConfig';

type ElectronApiBridge = {
  backendBaseUrl?: string;
};

function resolveBackendBaseUrl() {
  if (typeof window !== 'undefined') {
    const electronAPI = (window as Window & { electronAPI?: ElectronApiBridge }).electronAPI;
    if (electronAPI?.backendBaseUrl) {
      return electronAPI.backendBaseUrl;
    }
  }

  return buildBackendBaseUrl(DEFAULT_BACKEND_PORT);
}

const api = axios.create({
  baseURL: resolveBackendBaseUrl(),
  timeout: 10_000,
});

function readRendererEnv(name: string) {
  if (typeof process === "undefined" || !process.env) {
    return undefined;
  }

  return process.env[name];
}

const shouldLogApiRequests =
  readRendererEnv("NODE_ENV") === "development" &&
  readRendererEnv("DEBUG_API_REQUESTS") === "true";

api.interceptors.request.use((config) => {
  if (shouldLogApiRequests) {
    console.info(
      `[api] ${String(config.method ?? "GET").toUpperCase()} ${config.baseURL ?? ""}${config.url ?? ""}`
    );
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const baseUrl = err.config?.baseURL ?? "";
    const url = err.config?.url ?? "";
    console.error(
      `[api:error] ${String(err.config?.method ?? "GET").toUpperCase()} ${baseUrl}${url} -> ${err.message}`
    );
    // ✨ unify error shape
    return Promise.reject(
      new Error(err.response?.data?.message || err.message),
    );
  }
);
export default api;
