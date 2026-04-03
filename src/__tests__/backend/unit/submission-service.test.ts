import { SubmissionStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SubmissionService } from "../../../backend/api/submission/submission-service";
import { ProblemsDao } from "../../../backend/api/problem/problem-dao";
import { SubmissionDao } from "../../../backend/api/submission/submission-dao";
import { judgeSolution } from "../../../backend/services/judge/executor";
import { NotFoundError } from "../../../backend/utils/errors/not-found-error";

vi.mock("../../../backend/api/submission/submission-dao", () => ({
  SubmissionDao: {
    getSubmissionsByProblemId: vi.fn(),
    getSubmissionByProblemId: vi.fn(),
    createSubmission: vi.fn(),
    updateSubmissionStatus: vi.fn(),
    createSubmissionResults: vi.fn(),
  },
}));

vi.mock("../../../backend/api/problem/problem-dao", () => ({
  ProblemsDao: {
    getProblemById: vi.fn(),
  },
}));

vi.mock("../../../backend/services/judge/executor", async () => {
  const actual = await vi.importActual<typeof import("../../../backend/services/judge/executor")>(
    "../../../backend/services/judge/executor"
  );

  return {
    ...actual,
    judgeSolution: vi.fn(),
  };
});

const mockedJudgeSolution = vi.mocked(judgeSolution);
const mockedSubmissionDao = SubmissionDao as unknown as {
  getSubmissionsByProblemId: ReturnType<typeof vi.fn>;
  createSubmission: ReturnType<typeof vi.fn>;
  updateSubmissionStatus: ReturnType<typeof vi.fn>;
  createSubmissionResults: ReturnType<typeof vi.fn>;
};
const mockedProblemsDao = ProblemsDao as unknown as {
  getProblemById: ReturnType<typeof vi.fn>;
};

describe("SubmissionService", () => {
  const service = new SubmissionService() as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockedSubmissionDao.getSubmissionsByProblemId.mockResolvedValue([]);
    mockedProblemsDao.getProblemById.mockResolvedValue(null);
    service.languageService = {
      getLanguageById: vi.fn().mockResolvedValue({
        languageId: 1,
        suffix: "js",
        compilerCmd: "tsc {source}",
        runtimeCmd: "node {source}",
      }),
    };
    service.testCaseService = {
      getTestCases: vi.fn().mockResolvedValue([
        {
          testcaseId: 1,
          input: "1",
          expectedOutput: "2",
          timeLimitMs: 1000,
          memoryLimitMb: 128,
          isSample: true,
        },
      ]),
    };
  });

  it("returns an empty list when the problem exists but has no submissions", async () => {
    mockedProblemsDao.getProblemById.mockResolvedValue({
      problem_id: 1,
    });

    const response = await service.getSubmissionsByProblem(1);

    expect(response).toEqual([]);
    expect(mockedSubmissionDao.getSubmissionsByProblemId).toHaveBeenCalledWith(1);
    expect(mockedProblemsDao.getProblemById).toHaveBeenCalledWith(1);
  });

  it("throws NotFoundError when the problem does not exist and has no submissions", async () => {
    await expect(service.getSubmissionsByProblem(999)).rejects.toBeInstanceOf(
      NotFoundError
    );
    expect(mockedProblemsDao.getProblemById).toHaveBeenCalledWith(999);
  });

  it("omits expected output on compile errors during run", async () => {
    mockedJudgeSolution.mockResolvedValueOnce([
      {
        succeeded: false,
        executionTime: 12,
        executionMemoryKb: 0,
        output: "compile failed",
        stdout: "",
        stderr: "compile failed",
        exitCode: 2,
        timedOut: false,
        phase: "compile",
        status: SubmissionStatus.COMPILE_ERROR,
      },
    ]);

    const response = await service.runCode(1, {
      code: "bad code",
      languageId: 1,
    });

    expect(response.status).toBe(SubmissionStatus.COMPILE_ERROR);
    expect(response.results).toHaveLength(1);
    expect(response.results[0]).toMatchObject({
      status: SubmissionStatus.COMPILE_ERROR,
      phase: "compile",
      output: "compile failed",
      stderr: "compile failed",
    });
    expect(response.results[0].expectedOutput).toBeUndefined();
  });

  it("keeps expected output on runtime comparisons and stores compile errors without testcase expectations", async () => {
    mockedSubmissionDao.createSubmission.mockResolvedValue({
      submission_id: 9,
      problem_id: 1,
      language_id: 1,
      code: "bad code",
      status: SubmissionStatus.PENDING,
      submitted_at: new Date("2026-04-04T00:00:00.000Z"),
    });
    mockedSubmissionDao.updateSubmissionStatus.mockResolvedValue(undefined);
    mockedSubmissionDao.createSubmissionResults.mockResolvedValue([]);

    mockedJudgeSolution.mockResolvedValueOnce([
      {
        succeeded: false,
        executionTime: 15,
        executionMemoryKb: 0,
        output: "compile failed",
        stdout: "",
        stderr: "compile failed",
        exitCode: 2,
        timedOut: false,
        phase: "compile",
        status: SubmissionStatus.COMPILE_ERROR,
      },
    ]);

    const response = await service.submitCode(1, {
      code: "bad code",
      languageId: 1,
    });

    expect(response.overallStatus).toBe(SubmissionStatus.COMPILE_ERROR);
    expect(response.results[0].expectedOutput).toBeUndefined();
    expect(mockedSubmissionDao.createSubmissionResults).toHaveBeenCalledWith(
      9,
      [
        expect.objectContaining({
          status: SubmissionStatus.COMPILE_ERROR,
          phase: "compile",
          output: "compile failed",
        }),
      ]
    );
  });
});
