import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../../backend/api/app";
import { setPrisma } from "../../../backend/db/prisma/prisma";
import {
  dropAndSeedLanguage,
  setupTestDB,
  teardownTestDB,
} from "../utils/setupTestDB";

let app: import("express").Application;

beforeAll(async () => {
  const prisma = await setupTestDB();
  setPrisma(prisma);
  app = await createApp({ localApiAuthToken: null });
});

beforeEach(async () => {
  await dropAndSeedLanguage();
});

afterAll(async () => {
  await teardownTestDB();
});

describe("Language API routes", () => {
  it("GET /languages returns seeded languages with canonical and legacy command fields", async () => {
    const res = await request(app).get("/languages").expect(200);

    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          languageId: 1,
          name: "Python",
          suffix: "py",
          runtimeCmd: "python3 {source}",
          run_command: "python3 {source}",
          isDefault: true,
        }),
        expect.objectContaining({
          languageId: 2,
          name: "JavaScript",
          suffix: "js",
          runtimeCmd: "node {source}",
          run_command: "node {source}",
          isDefault: false,
        }),
      ])
    );
  });

  it("POST /languages rejects duplicate names and dotted duplicate suffixes", async () => {
    await request(app)
      .post("/languages")
      .send({
        name: " python ",
        suffix: "py3",
        runtimeCmd: "python3 {source}",
      })
      .expect(409);

    await request(app)
      .post("/languages")
      .send({
        name: "Python Alternate",
        suffix: ".PY",
        runtimeCmd: "python3 {source}",
      })
      .expect(409);
  });

  it("POST /languages accepts the legacy snake_case compiler field with canonical runtime command", async () => {
    const res = await request(app)
      .post("/languages")
      .send({
        name: "Go",
        suffix: "go",
        version: "1.22",
        compile_command: "go build -o {executable} {source}",
        runtimeCmd: "{executablePath}",
      })
      .expect(201);

    expect(res.body).toEqual(
      expect.objectContaining({
        name: "Go",
        suffix: "go",
        compilerCmd: "go build -o {executable} {source}",
        runtimeCmd: "{executablePath}",
        compile_command: "go build -o {executable} {source}",
        run_command: "{executablePath}",
      })
    );
  });

  it("POST /languages returns 422 when required fields are missing or empty", async () => {
    await request(app)
      .post("/languages")
      .send({
        name: "",
        suffix: "rs",
        runtimeCmd: "rustc {source}",
      })
      .expect(422);

    await request(app)
      .post("/languages")
      .send({
        name: "Rust",
        suffix: "rs",
      })
      .expect(422);
  });

  it("DELETE /languages/:id forbids default languages and removes custom languages", async () => {
    await request(app).delete("/languages/1").expect(403);

    const created = await request(app)
      .post("/languages")
      .send({
        name: "Ruby",
        suffix: "rb",
        runtimeCmd: "ruby {source}",
      })
      .expect(201);

    await request(app).delete(`/languages/${created.body.languageId}`).expect(204);
    await request(app).get(`/languages/${created.body.languageId}`).expect(404);
  });
});
