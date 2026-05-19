import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../../backend/api/app";
import { LOCAL_API_AUTH_HEADER } from "../../../shared/backendConfig";

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

  it("does not force auth in direct test apps when no token is configured", async () => {
    const app = await createApp({ localApiAuthToken: null });

    const res = await request(app).get("/not-a-real-route");

    expect(res.status).toBe(404);
  });
});
