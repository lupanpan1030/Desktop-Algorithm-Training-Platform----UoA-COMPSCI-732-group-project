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

export type ApiClientError = Error & {
  status?: number;
  code?: string;
  method?: string;
  requestUrl?: string;
  isNetworkError?: boolean;
};

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
    if (axios.isAxiosError(err)) {
      const normalizedError = new Error(
        err.response?.data?.message || err.message || "Request failed"
      ) as ApiClientError;

      normalizedError.status = err.response?.status;
      normalizedError.code = err.code;
      normalizedError.method = String(err.config?.method ?? "GET").toUpperCase();
      normalizedError.requestUrl = `${err.config?.baseURL ?? ""}${err.config?.url ?? ""}`;
      normalizedError.isNetworkError =
        !err.response &&
        (err.message === "Network Error" ||
          err.code === "ERR_NETWORK" ||
          err.code === "ECONNABORTED");

      return Promise.reject(normalizedError);
    }

    return Promise.reject(err instanceof Error ? err : new Error("Request failed"));
  }
);
export default api;
