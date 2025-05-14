/**
 * Integration tests for LanguageDao.
 * Ensures CRUD operations function correctly against an isolated
 * Prisma test database seeded with two languages.
 */
import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";

import {
  setupTestDB,
  dropAndSeedLanguage,
  teardownTestDB,
} from "../utils/setupTestDB";

import { setPrisma } from "../../../backend/db/prisma/prisma";
import { LanguageDao } from "../../../backend/api/language/language-dao";
import type {
  PrismaClient,
  ProgrammingLanguage,
} from "@prisma/client";
import type { CreateLanguageDto } from "../../../backend/api/language/language";

let testPrisma: PrismaClient;

/* ---------- Global Database Lifecycle ---------- */
beforeAll(async () => {
  testPrisma = await setupTestDB();
  setPrisma(testPrisma);
});

beforeEach(async () => {
  await dropAndSeedLanguage();          // Reset to two seed rows before each test case
});

afterAll(async () => {
  await teardownTestDB();               // Close the database connection and delete temporary files
});

/* ==================== DAO Integration Tests ==================== */
describe("LanguageDao", () => {
  /* ---------- Query All ---------- */
  describe("getAllLanguages()", () => {
    it("returns two seed languages with correct fields", async () => {
      const all = await LanguageDao.getAllLanguages();
      expect(all).toHaveLength(2);

      const names = all.map(l => l.name).sort();
      expect(names).toEqual(["Java", "Python"].sort());
      expect(all[0].language_id).toBe(1);
    });
  });

  /* ---------- Primary‑Key Query ---------- */
  describe("findLanguageById()", () => {
    it("returns the correct language when it exists", async () => {
      const lang = await LanguageDao.findLanguageById(2);
      expect(lang).not.toBeNull();
      expect((lang as ProgrammingLanguage).name).toBe("Java");
      expect((lang as ProgrammingLanguage).suffix).toBe("java");
      expect((lang as ProgrammingLanguage).is_default).toBe(false);
    });

    it("returns null when the language does not exist", async () => {
      const lang = await LanguageDao.findLanguageById(999);
      expect(lang).toBeNull();
    });
  });

  /* ---------- Create ---------- */
  describe("createLanguage()", () => {
    it("inserts a new language and returns its auto‑incremented ID", async () => {
      const data: CreateLanguageDto = {
        name: "Go",
        suffix: "go",
        version: "1.22",
        compilerCmd: "go build",
        runtimeCmd: "go run",
      };

      const created = await LanguageDao.createLanguage(data);
      expect(created.language_id).toBeGreaterThan(2);
      expect(created.name).toBe("Go");

      // 再次查询数据库确认已落库
      const fromDb = await testPrisma.programmingLanguage.findUnique({
        where: { language_id: created.language_id },
      });
      expect(fromDb).not.toBeNull();
      expect((fromDb as ProgrammingLanguage).suffix).toBe("go");
    });
  });

  /* ---------- Update ---------- */
  describe("updateLanguage()", () => {
    it("updates an existing language and returns the updated row", async () => {
      const updated = await LanguageDao.updateLanguage(1, { version: "3.10" });
      expect(updated.version).toBe("3.10");

      const check = await testPrisma.programmingLanguage.findUnique({
        where: { language_id: 1 },
      });
      expect((check as ProgrammingLanguage).version).toBe("3.10");
    });

    it("throws when updating a non‑existent ID", async () => {
      await expect(
        LanguageDao.updateLanguage(999, { name: "Nope" })
      ).rejects.toThrow();
    });
  });

  /* ---------- Delete ---------- */
  describe("deleteLanguage()", () => {
    it("deletes an existing row leaving one row remaining", async () => {
      await LanguageDao.deleteLanguage(2);

      const all = await testPrisma.programmingLanguage.findMany();
      expect(all).toHaveLength(1);
      expect(all[0].language_id).toBe(1);
    });

    it("throws when deleting a non‑existent ID", async () => {
      await expect(LanguageDao.deleteLanguage(999)).rejects.toThrow();

      const all = await testPrisma.programmingLanguage.findMany();
      expect(all).toHaveLength(2);
    });
  });
});
