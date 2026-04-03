/****
 * Integration tests for LanguageDao.
 * Verifies CRUD behavior against a temporary, isolated database.
 */
import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";

/* ---------- Shared Test Utilities ---------- */
// Adjust the import path if your project structure differs
import { setupTestDB, teardownTestDB, dropAndSeedLanguage} from "../utils/setupTestDB";
import { setPrisma } from "../../../backend/db/prisma/prisma";

/* ---------- Subject Under Test ---------- */
import { LanguageDao } from "../../../backend/api/language/language-dao";
import type { PrismaClient } from "@prisma/client";
import type { CreateLanguageDto } from "../../../backend/api/language/language";

let prisma: PrismaClient;

/* =========================================================
 * Global DB lifecycle: setup → reset before each test → teardown
 * ======================================================= */
beforeAll(async () => {
  prisma = await setupTestDB(); // Create temporary SQLite/Postgres test database
  setPrisma(prisma);            // Inject into DAO layer
});

beforeEach(async () => {
  await dropAndSeedLanguage();  // Reset to two fixed languages before each test
});

afterAll(async () => {
  await teardownTestDB();       // Close connection and clean up temporary files
});

/* =========================================================
 * LanguageDao integration tests
 * ======================================================= */
describe("LanguageDao", () => {

  /* ---------- getAllLanguages ---------- */
  it("getAllLanguages() — returns two seed languages", async () => {
    const all = await LanguageDao.getAllLanguages();
    expect(all).toHaveLength(2);

    // Verify fields
    const names = all.map(l => l.name).sort();
    expect(names).toEqual(["JavaScript", "Python"]);
    expect(all[0]).toEqual(
      expect.objectContaining({
        language_id: 1,
        suffix: "py",
        is_default: true,
      }),
    );
  });

  /* ---------- findLanguageById ---------- */
  it("findLanguageById() — returns language when it exists and null otherwise", async () => {
    const javaScript = await LanguageDao.findLanguageById(2);
    expect(javaScript?.name).toBe("JavaScript");

    const none = await LanguageDao.findLanguageById(999);
    expect(none).toBeNull();                             // 不存在
  });

  /* ---------- createLanguage ---------- */
  it("createLanguage() — inserts a new language and returns its auto-incremented ID", async () => {
    const dto: CreateLanguageDto = {
      name: "Go",
      suffix: "go",
      version: "1.22",
      compilerCmd: "go build",
      runtimeCmd: "go run",
    };

    const created = await LanguageDao.createLanguage(dto);
    expect(created.language_id).toBeGreaterThan(2);
    expect(created).toMatchObject({ name: "Go", suffix: "go" });

    // Query DB again to confirm it was persisted
    const inDb = await prisma.programmingLanguage.findUnique({
      where: { language_id: created.language_id },
    });
    expect(inDb?.suffix).toBe("go");
  });

  /* ---------- updateLanguage ---------- */
  it("updateLanguage() — updates an existing language", async () => {
    const updated = await LanguageDao.updateLanguage(1, { version: "3.10" });
    expect(updated.version).toBe("3.10");

    const check = await prisma.programmingLanguage.findUnique({
      where: { language_id: 1 },
    });
    expect(check?.version).toBe("3.10");
  });

  it("updateLanguage() — throws when updating a non-existent ID", async () => {
    await expect(
      LanguageDao.updateLanguage(999, { name: "Nope" }),
    ).rejects.toThrow();
  });

  /* ---------- deleteLanguage ---------- */
  it("deleteLanguage() — deletes an existing row leaving only one record", async () => {
    await LanguageDao.deleteLanguage(2);

    const all = await prisma.programmingLanguage.findMany();
    expect(all).toHaveLength(1);
    expect(all[0].language_id).toBe(1);
  });

  it("deleteLanguage() — throws when deleting a non-existent ID and leaves row count unchanged", async () => {
    await expect(LanguageDao.deleteLanguage(999)).rejects.toThrow();

    const all = await prisma.programmingLanguage.findMany();
    expect(all).toHaveLength(2);
  });
});
