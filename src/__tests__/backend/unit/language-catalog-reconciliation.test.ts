import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  setupTestDB,
  teardownTestDB,
} from "../utils/setupTestDB";
import { setPrisma } from "../../../backend/db/prisma/prisma";
import { reconcileLanguageCatalog } from "../../../backend/db/language-catalog/reconcile-language-catalog";

let testPrisma: PrismaClient;

beforeAll(async () => {
  testPrisma = await setupTestDB();
  setPrisma(testPrisma);
});

beforeEach(async () => {
  await testPrisma.submissionResult.deleteMany({});
  await testPrisma.submission.deleteMany({});
  await testPrisma.programmingLanguage.deleteMany({});

  await testPrisma.programmingLanguage.createMany({
    data: [
      {
        language_id: 1,
        name: "Python",
        normalized_name: null,
        normalized_suffix: null,
        suffix: " py ",
        version: "3.12",
        compile_command: null,
        run_command: "python3 {source}",
        is_default: true,
      },
      {
        language_id: 2,
        name: " python ",
        normalized_name: null,
        normalized_suffix: null,
        suffix: "py3",
        version: "3.12",
        compile_command: null,
        run_command: "python3 {source}",
        is_default: false,
      },
      {
        language_id: 3,
        name: "   ",
        normalized_name: null,
        normalized_suffix: null,
        suffix: "txt",
        version: null,
        compile_command: null,
        run_command: "cat {source}",
        is_default: false,
      },
      {
        language_id: 4,
        name: "JavaScript",
        normalized_name: "javascript",
        normalized_suffix: "js",
        suffix: "js",
        version: "20",
        compile_command: null,
        run_command: "node {source}",
        is_default: false,
      },
    ],
  });
});

afterAll(async () => {
  await teardownTestDB();
});

describe("reconcileLanguageCatalog", () => {
  it("backfills normalized names and renames conflicting display names deterministically", async () => {
    const result = await reconcileLanguageCatalog(testPrisma);

    expect(result).toEqual({
      renamedLanguages: 2,
      backfilledNames: 3,
      normalizedSuffixes: 3,
    });

    const languages = await testPrisma.programmingLanguage.findMany({
      orderBy: {
        language_id: "asc",
      },
    });

    expect(languages.map((language) => language.name)).toEqual([
      "Python",
      "python (2)",
      "Language 3",
      "JavaScript",
    ]);
    expect(languages.map((language) => language.suffix)).toEqual([
      "py",
      "py3",
      "txt",
      "js",
    ]);
    expect(languages.map((language) => language.normalized_name)).toEqual([
      "python",
      "python (2)",
      "language 3",
      "javascript",
    ]);
    expect(languages.map((language) => language.normalized_suffix)).toEqual([
      "py",
      "py3",
      "txt",
      "js",
    ]);
    expect(new Set(languages.map((language) => language.normalized_name)).size).toBe(4);
  });

  it("throws when two languages collapse to the same normalized suffix", async () => {
    await testPrisma.programmingLanguage.update({
      where: {
        language_id: 2,
      },
      data: {
        suffix: " PY ",
      },
    });

    await expect(reconcileLanguageCatalog(testPrisma)).rejects.toThrow(
      /invalid suffixes.*share suffix/i
    );
  });
});
