import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { ProblemsService } from "../../../backend/api/problem/problem-service";
import { ProblemsDao } from "../../../backend/api/problem/problem-dao";
import { NotFoundError } from "../../../backend/utils/errors/not-found-error";

// mock the entire ProblemDao module
vi.mock("../../../backend/api/problem/problem-dao", () => {
  return {
    ProblemsDao: {
      getAllProblems: vi.fn(),
      getProblemById: vi.fn(),
      createProblem: vi.fn(),
      updateProblem: vi.fn(),
      deleteProblem: vi.fn(),
    },
  };
});

let svc: ProblemsService;

beforeEach(() => {
  svc = new ProblemsService();
  // Clear call history & return values
  vi.clearAllMocks();
});

describe("ProblemsService", () => {
  describe("getAllProblems()", () => {
    it("maps DAO results to ProblemSummary[]", async () => {
      const raw = [
        {
          problem_id: 1,
          title: "A",
          description: "Desc A",
          difficulty: "EASY",
          source: "LOCAL",
          locale: "local",
          source_slug: null as string | null,
          external_problem_id: null as string | null,
          judge_ready: true,
          sample_testcase: null as string | null,
          _count: { test_cases: 2 },
          submissions: [{status:"ACCEPTED"}],
          test_cases: [{ is_sample: true }, { is_sample: false }],
          problem_tags: [
            { tag: { name: "Array" } },
            { tag: { name: "Hash Table" } },
          ],
          translations: [] as Array<{ locale: string; title: string; description: string }>,
        },
        {
          problem_id: 2,
          title: "B",
          description: "Desc B",
          difficulty: "HARD",
          source: "LEETCODE",
          locale: "zh-CN",
          source_slug: "problem-b",
          external_problem_id: "2",
          judge_ready: false,
          sample_testcase: "1 2",
          _count: { test_cases: 0 },
          submissions: [{status:"RUNTIME_ERROR"}],
          test_cases: [],
          problem_tags: [],
          translations: [] as Array<{ locale: string; title: string; description: string }>,
        },
      ];
      (ProblemsDao.getAllProblems as Mock).mockResolvedValue(raw);

      const summaries = await svc.getAllProblems();
      expect(summaries).toEqual([
        {
          problemId: 1,
          title: "A",
          difficulty: "EASY",
          completionState: "Completed",
          source: "LOCAL",
          locale: "en",
          defaultLocale: "en",
          availableLocales: ["en"],
          sourceSlug: null,
          externalProblemId: null,
          judgeReady: true,
          testcaseCount: 2,
          sampleCaseCount: 1,
          hiddenCaseCount: 1,
          sampleReferenceAvailable: false,
          tags: ["Array", "Hash Table"],
        },
        {
          problemId: 2,
          title: "B",
          difficulty: "HARD",
          completionState:"Attempted",
          source: "LEETCODE",
          locale: "zh-CN",
          defaultLocale: "zh-CN",
          availableLocales: ["zh-CN"],
          sourceSlug: "problem-b",
          externalProblemId: "2",
          judgeReady: false,
          testcaseCount: 0,
          sampleCaseCount: 0,
          hiddenCaseCount: 0,
          sampleReferenceAvailable: true,
          tags: [],
        },
      ]);
      expect(ProblemsDao.getAllProblems).toHaveBeenCalledOnce();
    });

    it("filters out problems that do not exist in the requested locale when strict mode is enabled", async () => {
      const raw = [
        {
          problem_id: 1,
          title: "Two Sum",
          description: "English only",
          difficulty: "EASY",
          source: "LOCAL",
          locale: "en",
          source_slug: null,
          external_problem_id: null,
          judge_ready: true,
          _count: { test_cases: 2 },
          test_cases: [{ is_sample: true }, { is_sample: false }],
          problem_tags: [],
          submissions: [] as Array<{ status: string }>,
          translations: [] as Array<{ locale: string; title: string; description: string }>,
        },
        {
          problem_id: 2,
          title: "Two Sum",
          description: "English",
          difficulty: "EASY",
          source: "LEETCODE",
          locale: "en",
          source_slug: "two-sum",
          external_problem_id: "1",
          judge_ready: true,
          _count: { test_cases: 2 },
          test_cases: [{ is_sample: true }, { is_sample: false }],
          problem_tags: [{ tag: { name: "Array" } }],
          submissions: [] as Array<{ status: string }>,
          translations: [
            {
              locale: "zh-CN",
              title: "两数之和",
              description: "中文",
            },
          ],
        },
      ];
      (ProblemsDao.getAllProblems as Mock).mockResolvedValue(raw);

      const summaries = await svc.getAllProblems("zh-CN", true);
      expect(summaries).toHaveLength(1);
      expect(summaries[0]).toMatchObject({
        problemId: 2,
        title: "两数之和",
        locale: "zh-CN",
      });
    });
  });

  describe("getProblem()", () => {
    it("returns ProblemDetails when found", async () => {
      const now = new Date();
      const raw = {
        problem_id: 5,
        title: "X",
        description: "Desc",
        difficulty: "MEDIUM",
        source: "LOCAL",
        locale: "local",
        source_slug: null as string | null,
        external_problem_id: null as string | null,
        judge_ready: true,
        sample_testcase: null as string | null,
        test_cases: [{ is_sample: true }, { is_sample: false }],
        problem_tags: [{ tag: { name: "Math" } }],
        starter_codes: [
          {
            language_slug: "python3",
            language_name: "Python3",
            template: "class Solution:\n    pass",
          },
        ],
        translations: [] as Array<{ locale: string; title: string; description: string }>,
        _count: { test_cases: 2 },
        created_at: now,
      };
      (ProblemsDao.getProblemById as Mock).mockResolvedValue(raw);

      const details = await svc.getProblem(5);

      expect(details).toEqual({
        problemId: 5,
        title: "X",
        description: "Desc",
        difficulty: "MEDIUM",
        createdAt: now.toISOString(),
        source: "LOCAL",
        locale: "en",
        defaultLocale: "en",
        availableLocales: ["en"],
        sourceSlug: null,
        externalProblemId: null,
        judgeReady: true,
        testcaseCount: 2,
        sampleReferenceAvailable: false,
        sampleTestcase: null,
        sampleCaseCount: 1,
        hiddenCaseCount: 1,
        tags: ["Math"],
        starterCodes: [
          {
            languageSlug: "python3",
            languageName: "Python3",
            template: "class Solution:\n    pass",
          },
        ],
      });
      expect(ProblemsDao.getProblemById).toHaveBeenCalledWith(5);
      expect(ProblemsDao.getProblemById).toHaveBeenCalledOnce();
    });

    it("throws NotFoundError when DAO returns null", async () => {
      (ProblemsDao.getProblemById as Mock).mockResolvedValue(null);

      await expect(svc.getProblem(999)).rejects.toBeInstanceOf(NotFoundError);
      expect(ProblemsDao.getProblemById).toHaveBeenCalledWith(999);
      expect(ProblemsDao.getProblemById).toHaveBeenCalledOnce();
    });

    it("throws NotFoundError when strict locale mode is enabled and the problem has no translation for it", async () => {
      const now = new Date();
      (ProblemsDao.getProblemById as Mock).mockResolvedValue({
        problem_id: 5,
        title: "English Only",
        description: "Desc",
        difficulty: "MEDIUM",
        source: "LOCAL",
        locale: "en",
        source_slug: null,
        external_problem_id: null,
        judge_ready: true,
        sample_testcase: null,
        test_cases: [{ is_sample: true }, { is_sample: false }],
        problem_tags: [],
        starter_codes: [],
        translations: [] as Array<{ locale: string; title: string; description: string }>,
        _count: { test_cases: 2 },
        created_at: now,
      });

      await expect(svc.getProblem(5, "zh-CN", true)).rejects.toBeInstanceOf(
        NotFoundError
      );
    });
  });

  describe("createProblem()", () => {
    it("returns ProblemDetails for newly created", async () => {
      const now = new Date();
      const raw = {
        problem_id: 10,
        title: "New",
        description: "New Desc",
        difficulty: "EASY",
        source: "LOCAL",
        locale: "local",
        source_slug: null as string | null,
        external_problem_id: null as string | null,
        judge_ready: false,
        sample_testcase: null as string | null,
        test_cases: [] as Array<{ is_sample: boolean }>,
        problem_tags: [] as Array<{ tag: { name: string } }>,
        starter_codes: [] as Array<{
          language_slug: string;
          language_name: string;
          template: string;
        }>,
        translations: [] as Array<{ locale: string; title: string; description: string }>,
        _count: { test_cases: 0 },
        created_at: now,
      };
      (ProblemsDao.createProblem as Mock).mockResolvedValue(raw);

      const params = {
        title: "New",
        description: "New Desc",
        difficulty: "EASY" as const,
      };
      const details = await svc.createProblem(params);

      expect(details).toEqual({
        problemId: 10,
        title: "New",
        description: "New Desc",
        difficulty: "EASY",
        createdAt: now.toISOString(),
        source: "LOCAL",
        locale: "en",
        defaultLocale: "en",
        availableLocales: ["en"],
        sourceSlug: null,
        externalProblemId: null,
        judgeReady: false,
        testcaseCount: 0,
        sampleReferenceAvailable: false,
        sampleTestcase: null,
        sampleCaseCount: 0,
        hiddenCaseCount: 0,
        tags: [],
        starterCodes: [],
      });
      expect(ProblemsDao.createProblem).toHaveBeenCalledWith(params);
      expect(ProblemsDao.createProblem).toHaveBeenCalledOnce();
    });
  });

  describe("updateProblem()", () => {
    it("returns updated ProblemDetails when DAO finds it", async () => {
      const now = new Date();
      const raw = {
        problem_id: 7,
        title: "Upd",
        description: "Upd Desc",
        difficulty: "HARD",
        source: "LEETCODE",
        locale: "zh-CN",
        source_slug: "upd",
        external_problem_id: "7",
        judge_ready: true,
        sample_testcase: "1 2",
        test_cases: [{ is_sample: true }, { is_sample: false }, { is_sample: false }],
        problem_tags: [{ tag: { name: "String" } }],
        starter_codes: [
          {
            language_slug: "javascript",
            language_name: "JavaScript",
            template: "function solve() {}",
          },
        ],
        translations: [] as Array<{ locale: string; title: string; description: string }>,
        _count: { test_cases: 3 },
        created_at: now,
      };
      (ProblemsDao.updateProblem as Mock).mockResolvedValue(raw);

      const params = { title: "Upd", difficulty: "HARD" as const };
      const details = await svc.updateProblem(7, params);

      expect(details).toEqual({
        problemId: 7,
        title: "Upd",
        description: "Upd Desc",
        difficulty: "HARD",
        createdAt: now.toISOString(),
        source: "LEETCODE",
        locale: "zh-CN",
        defaultLocale: "zh-CN",
        availableLocales: ["zh-CN"],
        sourceSlug: "upd",
        externalProblemId: "7",
        judgeReady: true,
        testcaseCount: 3,
        sampleReferenceAvailable: true,
        sampleTestcase: "1 2",
        sampleCaseCount: 1,
        hiddenCaseCount: 2,
        tags: ["String"],
        starterCodes: [
          {
            languageSlug: "javascript",
            languageName: "JavaScript",
            template: "function solve() {}",
          },
        ],
      });
      expect(ProblemsDao.updateProblem).toHaveBeenCalledWith(7, params);
      expect(ProblemsDao.updateProblem).toHaveBeenCalledOnce();
    });

    it("throws NotFoundError when DAO returns null", async () => {
      (ProblemsDao.updateProblem as Mock).mockResolvedValue(null);

      await expect(svc.updateProblem(999, {})).rejects.toBeInstanceOf(
        NotFoundError
      );
      expect(ProblemsDao.updateProblem).toHaveBeenCalledWith(999, {});
      expect(ProblemsDao.updateProblem).toHaveBeenCalledOnce();
    });

    it("rethrows DAO errors instead of translating them into NotFoundError", async () => {
      const daoError = new Error("database unavailable");
      (ProblemsDao.updateProblem as Mock).mockRejectedValue(daoError);

      await expect(svc.updateProblem(7, { title: "Broken" })).rejects.toBe(
        daoError
      );
      expect(ProblemsDao.updateProblem).toHaveBeenCalledWith(7, {
        title: "Broken",
      });
      expect(ProblemsDao.updateProblem).toHaveBeenCalledOnce();
    });
  });

  describe("deleteProblem()", () => {
    it("forwards the call to ProblemsDao.deleteProblem", async () => {
      (ProblemsDao.deleteProblem as Mock).mockResolvedValue(undefined);

      await expect(svc.deleteProblem(3)).resolves.toBeUndefined();
      expect(ProblemsDao.deleteProblem).toHaveBeenCalledWith(3);
      expect(ProblemsDao.deleteProblem).toHaveBeenCalledOnce();
    });
  });
});
