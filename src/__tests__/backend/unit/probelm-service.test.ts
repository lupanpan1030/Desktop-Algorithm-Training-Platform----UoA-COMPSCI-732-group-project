import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { ProblemsService } from "../../../backend/api/problems/problem-service";
import { ProblemsDao } from "../../../backend/api/problems/problem-dao";
import { NotFoundError } from "../../../backend/utils/errors/not-found-error";

// mock the entire ProblemDao module
vi.mock("../../../backend/api/problems/problem-dao", () => {
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
        { problem_id: 1, title: "A", difficulty: "EASY" },
        { problem_id: 2, title: "B", difficulty: "HARD" },
      ];
      (ProblemsDao.getAllProblems as Mock).mockResolvedValue(raw);

      const summaries = await svc.getAllProblems();
      expect(summaries).toEqual([
        { problemId: 1, title: "A", difficulty: "EASY" },
        { problemId: 2, title: "B", difficulty: "HARD" },
      ]);
      expect(ProblemsDao.getAllProblems).toHaveBeenCalledOnce();
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
  });

  describe("createProblem()", () => {
    it("returns ProblemDetails for newly created", async () => {
      const now = new Date();
      const raw = {
        problem_id: 10,
        title: "New",
        description: "New Desc",
        difficulty: "EASY",
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
