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
          source_slug: null,
          external_problem_id: null,
          judge_ready: true,
          _count: { test_cases: 2 },
          submissions: [{status:"ACCEPTED"}],
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
          _count: { test_cases: 0 },
          submissions: [{status:"RUNTIME_ERROR"}],
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
          submissions: [],
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
          submissions: [],
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
        sampleTestcase: null,
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
        sampleTestcase: null,
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
        sampleTestcase: "1 2",
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
