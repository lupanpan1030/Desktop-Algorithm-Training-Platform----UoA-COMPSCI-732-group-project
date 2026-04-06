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
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // ✨ unify error shape
    return Promise.reject(
      new Error(err.response?.data?.message || err.message),
    );
  }
);
export default api;
