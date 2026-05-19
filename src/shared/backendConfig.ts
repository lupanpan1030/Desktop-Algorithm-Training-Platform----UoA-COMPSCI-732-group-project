export const DEFAULT_BACKEND_HOST = "127.0.0.1";
export const DEFAULT_BACKEND_PORT = 6785;
export const LOCAL_API_AUTH_HEADER = "x-algo-platform-api-token";
export const LOCAL_API_AUTH_TOKEN_ENV = "LOCAL_API_AUTH_TOKEN";
export const LOCAL_API_AUTH_TOKEN_ARG_PREFIX = "--local-api-auth-token=";

export function normalizeBackendPort(value?: string | number | null) {
  const numericPort =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? DEFAULT_BACKEND_PORT), 10);

  if (Number.isInteger(numericPort) && numericPort > 0 && numericPort <= 65535) {
    return numericPort;
  }

  return DEFAULT_BACKEND_PORT;
}

export function buildBackendBaseUrl(
  port = DEFAULT_BACKEND_PORT,
  host = DEFAULT_BACKEND_HOST
) {
  return `http://${host}:${port}`;
}
