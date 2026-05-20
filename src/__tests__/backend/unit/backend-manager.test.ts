import * as http from "http";
import { afterEach, describe, expect, it } from "vitest";
import { waitForBackend } from "../../../backendManager";
import {
  DEFAULT_BACKEND_HOST,
  LOCAL_API_AUTH_HEADER,
  LOCAL_API_AUTH_TOKEN_ENV,
} from "../../../shared/backendConfig";

const originalPort = process.env.PORT;
const originalLocalApiAuthToken = process.env[LOCAL_API_AUTH_TOKEN_ENV];

function listen(server: http.Server, port = 0) {
  return new Promise<number>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, DEFAULT_BACKEND_HOST, () => {
      server.off("error", reject);
      const address = server.address();
      if (address && typeof address === "object") {
        resolve(address.port);
        return;
      }
      reject(new Error("Server did not expose a TCP port"));
    });
  });
}

function close(server: http.Server) {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

afterEach(() => {
  if (originalPort === undefined) {
    delete process.env.PORT;
  } else {
    process.env.PORT = originalPort;
  }

  if (originalLocalApiAuthToken === undefined) {
    delete process.env[LOCAL_API_AUTH_TOKEN_ENV];
  } else {
    process.env[LOCAL_API_AUTH_TOKEN_ENV] = originalLocalApiAuthToken;
  }
});

describe("waitForBackend", () => {
  it("includes the local API token in readiness requests", async () => {
    const token = "readiness-token";
    const server = http.createServer((req, res) => {
      if (
        req.url === "/problems" &&
        req.headers[LOCAL_API_AUTH_HEADER] === token
      ) {
        res.writeHead(200, { "content-type": "application/json" });
        res.end("[]");
        return;
      }

      res.writeHead(401, { "content-type": "application/json" });
      res.end('{"message":"Unauthorized local API request"}');
    });

    try {
      const port = await listen(server);
      process.env.PORT = String(port);
      process.env[LOCAL_API_AUTH_TOKEN_ENV] = token;

      await expect(waitForBackend(1500)).resolves.toBeUndefined();
    } finally {
      await close(server);
    }
  });
});
