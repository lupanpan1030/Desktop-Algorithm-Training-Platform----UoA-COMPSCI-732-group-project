import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../../backend/api/app";
import {
  LOCAL_API_AUTH_HEADER,
  LOCAL_API_AUTH_TOKEN_ENV,
} from "../../../shared/backendConfig";

describe("local API auth middleware", () => {
  it("rejects requests without the local API token when auth is enabled", async () => {
    const app = await createApp({ localApiAuthToken: "test-local-api-token" });

    const res = await request(app).get("/not-a-real-route");

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      message: "Unauthorized local API request",
    });
  });

  it("allows requests with the local API token when auth is enabled", async () => {
    const app = await createApp({ localApiAuthToken: "test-local-api-token" });

    const res = await request(app)
      .get("/not-a-real-route")
      .set(LOCAL_API_AUTH_HEADER, "test-local-api-token");

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      message: "Not Found",
    });
  });

  it("rejects an incorrect token even when it has the expected length", async () => {
    const app = await createApp({ localApiAuthToken: "test-local-api-token" });

    const res = await request(app)
      .get("/not-a-real-route")
      .set(LOCAL_API_AUTH_HEADER, "wrong-local-api-token");

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      message: "Unauthorized local API request",
    });
  });

  it("allows CORS preflight requests without a token", async () => {
    const app = await createApp({ localApiAuthToken: "test-local-api-token" });

    const res = await request(app)
      .options("/problems")
      .set("Origin", "http://localhost:4300")
      .set("Access-Control-Request-Method", "GET")
      .set("Access-Control-Request-Headers", LOCAL_API_AUTH_HEADER);

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:4300");
  });

  it("uses the environment token when createApp is not passed an explicit override", async () => {
    const previousToken = process.env[LOCAL_API_AUTH_TOKEN_ENV];
    process.env[LOCAL_API_AUTH_TOKEN_ENV] = "env-local-api-token";

    try {
      const app = await createApp();

      await request(app).get("/not-a-real-route").expect(401);
      await request(app)
        .get("/not-a-real-route")
        .set(LOCAL_API_AUTH_HEADER, "env-local-api-token")
        .expect(404);
    } finally {
      if (previousToken === undefined) {
        delete process.env[LOCAL_API_AUTH_TOKEN_ENV];
      } else {
        process.env[LOCAL_API_AUTH_TOKEN_ENV] = previousToken;
      }
    }
  });

  it("does not force auth in direct test apps when no token is configured", async () => {
    const app = await createApp({ localApiAuthToken: null });

    const res = await request(app).get("/not-a-real-route");

    expect(res.status).toBe(404);
  });
});
