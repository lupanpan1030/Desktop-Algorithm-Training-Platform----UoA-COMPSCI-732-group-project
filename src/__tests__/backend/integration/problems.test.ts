import request from "supertest";
import { describe, it, beforeAll, beforeEach, afterAll, expect } from "vitest";
import {
  setupTestDB,
  teardownTestDB,
  dropAndSeedProblems,
  dropAndSeedTestCases,
  testPrisma,
} from "../utils/setupTestDB";
import { createApp } from "../../../backend/api/app";
import { setPrisma } from "../../../backend/db/prisma/prisma";

let app: import("express").Application;

beforeAll(async () => {
  // Push your schema & connect to a temp SQLite file
  const testPrisma = await setupTestDB();
  setPrisma(testPrisma);
  app = await createApp();
});

beforeEach(async () => {
  // Reset just the problems table
  await testPrisma.tag.deleteMany({});
  await dropAndSeedProblems();
  await dropAndSeedTestCases();
});

afterAll(async () => {
  // Tear down DB file & disconnect
  await teardownTestDB();
});

describe("Problems API (integration)", () => {
  describe("GET /problems", () => {
    it("returns 200 + list of ProblemSummary", async () => {
      const res = await request(app).get("/problems");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toMatchObject({
        problemId: expect.any(Number),
        title: expect.any(String),
        difficulty: expect.any(String),
        testcaseCount: expect.any(Number),
        sampleCaseCount: expect.any(Number),
        hiddenCaseCount: expect.any(Number),
        sampleReferenceAvailable: expect.any(Boolean),
        judgeReady: expect.any(Boolean),
        source: expect.any(String),
        locale: expect.any(String),
        defaultLocale: expect.any(String),
        availableLocales: expect.any(Array),
        tags: expect.any(Array),
      });
    });

    it("returns translated summaries when a preferred locale is requested", async () => {
      await testPrisma.problemTranslation.create({
        data: {
          problem_id: 1,
          locale: "zh-CN",
          title: "两数之和",
          description: "给定一个整数数组 nums 和一个整数目标值 target。",
        },
      });
      const tag = await testPrisma.tag.create({
        data: {
          name: "Array",
        },
      });
      await testPrisma.problemTag.create({
        data: {
          problem_id: 1,
          tag_id: tag.tag_id,
        },
      });
      await testPrisma.problem.update({
        where: { problem_id: 1 },
        data: { sample_testcase: "2 7 11 15\n9" },
      });

      const res = await request(app).get("/problems").query({ locale: "zh-CN" });
      expect(res.status).toBe(200);
      expect(res.body[0]).toMatchObject({
        problemId: 1,
        title: "两数之和",
        locale: "zh-CN",
        defaultLocale: "en",
        availableLocales: ["en", "zh-CN"],
        sampleCaseCount: 1,
        hiddenCaseCount: 1,
        sampleReferenceAvailable: true,
        tags: ["Array"],
      });
    });

    it("returns only problems available in the requested locale when strictLocale is enabled", async () => {
      await testPrisma.problemTranslation.create({
        data: {
          problem_id: 1,
          locale: "zh-CN",
          title: "两数之和",
          description: "给定一个整数数组 nums 和一个整数目标值 target。",
        },
      });

      const res = await request(app)
        .get("/problems")
        .query({ locale: "zh-CN", strictLocale: true });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        problemId: 1,
        title: "两数之和",
        locale: "zh-CN",
      });
    });
  });

  describe("GET /problems/:id", () => {
    it("returns 200 + ProblemDetails when problem id exists", async () => {
      const res = await request(app).get("/problems/1");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        problemId: 1,
        title: "Two Sum",
        description: expect.stringContaining("Given an array"),
        difficulty: "EASY",
        createdAt: expect.any(String),
        testcaseCount: 2,
        judgeReady: true,
        source: "LOCAL",
        locale: "en",
        defaultLocale: "en",
        availableLocales: ["en"],
        sampleReferenceAvailable: false,
        sampleCaseCount: 1,
        hiddenCaseCount: 1,
        tags: [],
        starterCodes: [],
      });
      // ISO check
      expect(() => new Date(res.body.createdAt)).not.toThrow();
    });

    it("returns the requested locale when a translated title and description exist", async () => {
      await testPrisma.problemTranslation.create({
        data: {
          problem_id: 1,
          locale: "zh-CN",
          title: "两数之和",
          description: "给定一个整数数组 nums 和一个整数目标值 target。",
        },
      });
      const tag = await testPrisma.tag.create({
        data: {
          name: "Array",
        },
      });
      await testPrisma.problemTag.create({
        data: {
          problem_id: 1,
          tag_id: tag.tag_id,
        },
      });
      await testPrisma.problemStarterCode.create({
        data: {
          problem_id: 1,
          language_slug: "python3",
          language_name: "Python3",
          template: "class Solution:\n    pass",
        },
      });
      await testPrisma.problem.update({
        where: { problem_id: 1 },
        data: { sample_testcase: "2 7 11 15\n9" },
      });

      const res = await request(app).get("/problems/1").query({ locale: "zh-CN" });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        problemId: 1,
        title: "两数之和",
        description: "给定一个整数数组 nums 和一个整数目标值 target。",
        locale: "zh-CN",
        defaultLocale: "en",
        availableLocales: ["en", "zh-CN"],
        sampleReferenceAvailable: true,
        sampleTestcase: "2 7 11 15\n9",
        sampleCaseCount: 1,
        hiddenCaseCount: 1,
        tags: ["Array"],
        starterCodes: [
          {
            languageSlug: "python3",
            languageName: "Python3",
            template: "class Solution:\n    pass",
          },
        ],
      });
    });

    it("returns 404 when strictLocale is enabled and the requested translation does not exist", async () => {
      const res = await request(app)
        .get("/problems/1")
        .query({ locale: "zh-CN", strictLocale: true });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        message: "Problem not available in the requested locale",
      });
    });

    it("returns 404 when problem id not exists", async () => {
      const res = await request(app).get("/problems/999");
      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ message: "Problem not found" });
    });
  });

  describe("POST /problems", () => {
    it("returns 201 + ProblemDetails when body is valid", async () => {
      const createParams = {
        title: "Reverse Linked List",
        description: "Given the head of a singly linked list, reverse it.",
        difficulty: "MEDIUM",
      };
      const res = await request(app).post("/problems").send(createParams);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        problemId: expect.any(Number),
        ...createParams,
        createdAt: expect.any(String),
        testcaseCount: 0,
        judgeReady: false,
        source: "LOCAL",
        locale: "en",
        defaultLocale: "en",
        availableLocales: ["en"],
        sampleReferenceAvailable: false,
        sampleCaseCount: 0,
        hiddenCaseCount: 0,
        tags: [],
        starterCodes: [],
      });
    });

    it("return 422 when the required field is missing", async () => {
      const bad1 = {
        description: "Long engough description",
        difficulty: "EASY",
      };
      const res = await request(app).post("/problems").send(bad1);
      expect(res.status).toBe(422);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: "Validation Failed",
          details: expect.objectContaining({
            "requestBody.title": expect.objectContaining({
              message: expect.any(String),
            }),
          }),
        })
      );
    });

    it("return 422 when the field does not meet the constrains", async () => {
      const bad2 = {
        title: "xxxxxx",
        description: "Too short",
        difficulty: "EASY",
      };
      const res = await request(app).post("/problems").send(bad2);
      expect(res.status).toBe(422);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: "Validation Failed",
          details: expect.objectContaining({
            "requestBody.description": expect.objectContaining({
              message: expect.any(String),
              value: expect.any(String),
            }),
          }),
        })
      );
    });

    it("return 422 when difficulty is not within enum", async () => {
      const bad3 = {
        title: "xxxxxx",
        description: "Long engough description",
        difficulty: "FOO",
      };
      const res = await request(app).post("/problems").send(bad3);
      expect(res.status).toBe(422);
      expect(res.body).toMatchObject(
        expect.objectContaining({
          message: "Validation Failed",
          details: expect.objectContaining({
            "requestBody.difficulty": expect.objectContaining({
              message: expect.any(String),
              value: expect.any(String),
            }),
          }),
        })
      );
    });
  });

  describe("PUT /problems/:id", () => {
    it("returns 200 + updated ProblemDetails when problem exists", async () => {
      const update = { title: "Two Sum Updated", difficulty: "HARD" };
      const res = await request(app).put("/problems/1").send(update);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        problemId: 1,
        title: update.title,
        difficulty: update.difficulty,
        description: expect.any(String),
        createdAt: expect.any(String),
        testcaseCount: 2,
        judgeReady: true,
        source: "LOCAL",
        locale: "en",
        defaultLocale: "en",
        availableLocales: ["en"],
        sampleReferenceAvailable: false,
        sampleCaseCount: 1,
        hiddenCaseCount: 1,
        tags: [],
        starterCodes: [],
      });
    });
  

    it("return 404 when updating id not exists", async () => {
      const res = await request(app)
        .put("/problems/999")
        .send({ title: "Xxxxx" });
      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ message: "Problem not found" });
    });

    it("return 422 when the field does not meet the constrains", async () => {
      const bad1 = {
        title: "xxxxxx",
        description: "Too short",
      };
      const res = await request(app).put("/problems/1").send(bad1);
      expect(res.status).toBe(422);
      expect(res.body).toEqual(
        expect.objectContaining({
          message: "Validation Failed",
          details: expect.objectContaining({
            "requestBody.description": expect.objectContaining({
              message: expect.any(String),
              value: expect.any(String),
            }),
          }),
        })
      );
    }
    );

    it("return 422 when difficulty is not within enum", async () => {
      const bad2 = {
        difficulty: "FOO",
      };
      const res = await request(app).put("/problems/1").send(bad2);
      expect(res.status).toBe(422);
      expect(res.body).toMatchObject(
        expect.objectContaining({
          message: "Validation Failed",
          details: expect.objectContaining({
            "requestBody.difficulty": expect.objectContaining({
              message: expect.any(String),
              value: expect.any(String),
            }),
          }),
        })
      );
    });

  describe("DELETE /problems/:id", () => {
    it("return 204 when problem id exists", async () => {
      const res = await request(app).delete("/problems/1");
      expect(res.status).toBe(204);
    });

    it("return 204 when problem id not exists", async () => {
      const res = await request(app).delete("/problems/999");
      expect(res.status).toBe(204);
    });
  });
  });
});
