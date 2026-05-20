import { SubmissionStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SubmissionService } from "../../../backend/api/submission/submission-service";
import { ProblemsDao } from "../../../backend/api/problem/problem-dao";
import { SubmissionDao } from "../../../backend/api/submission/submission-dao";
import {
  JudgeExecutionSetupError,
  judgeSolution,
} from "../../../backend/services/judge/executor";
import { NotFoundError } from "../../../backend/utils/errors/not-found-error";

vi.mock("../../../backend/api/submission/submission-dao", () => ({
  SubmissionDao: {
    getSubmissionsByProblemId: vi.fn(),
    getSubmissionByProblemId: vi.fn(),
    createSubmission: vi.fn(),
    finalizeSubmission: vi.fn(),
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
  finalizeSubmission: ReturnType<typeof vi.fn>;
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
    mockedSubmissionDao.finalizeSubmission.mockResolvedValue(undefined);
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
    expect(mockedSubmissionDao.finalizeSubmission).toHaveBeenCalledWith(
      9,
      SubmissionStatus.COMPILE_ERROR,
      [
        expect.objectContaining({
          status: SubmissionStatus.COMPILE_ERROR,
          phase: "compile",
          output: "compile failed",
        }),
      ]
    );
  });

  it("passes testcase memory limits through to the judge", async () => {
    mockedJudgeSolution.mockResolvedValueOnce([
      {
        succeeded: true,
        executionTime: 10,
        executionMemoryKb: 2048,
        output: "2",
        stdout: "2",
        stderr: "",
        exitCode: 0,
        timedOut: false,
        phase: "run",
        status: SubmissionStatus.ACCEPTED,
      },
    ]);

    await service.runCode(1, {
      code: "print(2)",
      languageId: 1,
    });

    expect(mockedJudgeSolution).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        testCases: [
          expect.objectContaining({
            input: "1",
            timeLimitMs: 1000,
            memoryLimitMb: 128,
          }),
        ],
      })
    );
  });

  it("runs only sample testcases first and caps Run to three cases", async () => {
    service.testCaseService = {
      getTestCases: vi.fn().mockResolvedValue([
        {
          testcaseId: 1,
          input: "hidden-first",
          expectedOutput: "ignored",
          timeLimitMs: 1000,
          memoryLimitMb: 128,
          isSample: false,
        },
        {
          testcaseId: 2,
          input: "sample-1",
          expectedOutput: "ok",
          timeLimitMs: 100,
          memoryLimitMb: 16,
          isSample: true,
        },
        {
          testcaseId: 3,
          input: "sample-2",
          expectedOutput: "ok",
          timeLimitMs: 200,
          memoryLimitMb: 32,
          isSample: true,
        },
        {
          testcaseId: 4,
          input: "sample-3",
          expectedOutput: "ok",
          timeLimitMs: 300,
          memoryLimitMb: 64,
          isSample: true,
        },
        {
          testcaseId: 5,
          input: "sample-4",
          expectedOutput: "ignored",
          timeLimitMs: 400,
          memoryLimitMb: 128,
          isSample: true,
        },
      ]),
    };
    mockedJudgeSolution.mockResolvedValueOnce(
      ["sample-1", "sample-2", "sample-3"].map(() => ({
        succeeded: true,
        executionTime: 10,
        executionMemoryKb: 2048,
        output: "ok",
        stdout: "ok",
        stderr: "",
        exitCode: 0,
        timedOut: false,
        phase: "run" as const,
        status: SubmissionStatus.ACCEPTED,
      }))
    );

    const response = await service.runCode(1, {
      code: "print('ok')",
      languageId: 1,
    });

    expect(response.status).toBe(SubmissionStatus.ACCEPTED);
    expect(mockedJudgeSolution).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        testCases: [
          expect.objectContaining({ input: "sample-1", timeLimitMs: 100, memoryLimitMb: 16 }),
          expect.objectContaining({ input: "sample-2", timeLimitMs: 200, memoryLimitMb: 32 }),
          expect.objectContaining({ input: "sample-3", timeLimitMs: 300, memoryLimitMb: 64 }),
        ],
      })
    );
  });

  it("falls back to the first three hidden cases when no sample cases exist", async () => {
    service.testCaseService = {
      getTestCases: vi.fn().mockResolvedValue(
        ["hidden-1", "hidden-2", "hidden-3", "hidden-4"].map((input, index) => ({
          testcaseId: index + 1,
          input,
          expectedOutput: "ok",
          timeLimitMs: 1000,
          memoryLimitMb: 128,
          isSample: false,
        }))
      ),
    };
    mockedJudgeSolution.mockResolvedValueOnce(
      ["hidden-1", "hidden-2", "hidden-3"].map(() => ({
        succeeded: true,
        executionTime: 10,
        executionMemoryKb: 2048,
        output: "ok",
        stdout: "ok",
        stderr: "",
        exitCode: 0,
        timedOut: false,
        phase: "run" as const,
        status: SubmissionStatus.ACCEPTED,
      }))
    );

    await service.runCode(1, {
      code: "print('ok')",
      languageId: 1,
    });

    expect(mockedJudgeSolution).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        testCases: [
          expect.objectContaining({ input: "hidden-1" }),
          expect.objectContaining({ input: "hidden-2" }),
          expect.objectContaining({ input: "hidden-3" }),
        ],
      })
    );
  });

  it("trims successful output for comparison and rejects mismatched output", async () => {
    service.testCaseService = {
      getTestCases: vi.fn().mockResolvedValue([
        {
          testcaseId: 1,
          input: "1",
          expectedOutput: "2  ",
          timeLimitMs: 1000,
          memoryLimitMb: 128,
          isSample: true,
        },
        {
          testcaseId: 2,
          input: "2",
          expectedOutput: "3",
          timeLimitMs: 1000,
          memoryLimitMb: 128,
          isSample: true,
        },
      ]),
    };
    mockedJudgeSolution.mockResolvedValueOnce([
      {
        succeeded: true,
        executionTime: 10,
        executionMemoryKb: 2048,
        output: "2\n",
        stdout: "2\n",
        stderr: "",
        exitCode: 0,
        timedOut: false,
        phase: "run",
        status: SubmissionStatus.ACCEPTED,
      },
      {
        succeeded: true,
        executionTime: 10,
        executionMemoryKb: 2048,
        output: "wrong",
        stdout: "wrong",
        stderr: "",
        exitCode: 0,
        timedOut: false,
        phase: "run",
        status: SubmissionStatus.ACCEPTED,
      },
    ]);

    const response = await service.runCode(1, {
      code: "print('x')",
      languageId: 1,
    });

    expect(response.status).toBe(SubmissionStatus.REJECTED);
    expect(response.results[0]).toMatchObject({
      status: SubmissionStatus.ACCEPTED,
      expectedOutput: "2",
    });
    expect(response.results[1]).toMatchObject({
      status: SubmissionStatus.REJECTED,
      expectedOutput: "3",
    });
  });

  it("throws NotFoundError when running or submitting without testcases", async () => {
    service.testCaseService = {
      getTestCases: vi.fn().mockResolvedValue([]),
    };

    await expect(
      service.runCode(1, { code: "print('x')", languageId: 1 })
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      service.submitCode(1, { code: "print('x')", languageId: 1 })
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(mockedJudgeSolution).not.toHaveBeenCalled();
    expect(mockedSubmissionDao.createSubmission).not.toHaveBeenCalled();
  });

  it("preserves setup-error phase and status when Run cannot start the judge", async () => {
    service.languageService = {
      getLanguageById: vi.fn().mockResolvedValue({
        languageId: 1,
        suffix: "py",
        compilerCmd: null,
        runtimeCmd: "",
      }),
    };
    mockedJudgeSolution.mockRejectedValueOnce(
      new JudgeExecutionSetupError(
        "interpretCmd is required for interprete mode.",
        "run",
        SubmissionStatus.RUNTIME_ERROR
      )
    );

    const response = await service.runCode(1, {
      code: "print('x')",
      languageId: 1,
    });

    expect(response.status).toBe(SubmissionStatus.RUNTIME_ERROR);
    expect(response.results[0]).toMatchObject({
      status: SubmissionStatus.RUNTIME_ERROR,
      phase: "run",
      stderr: "interpretCmd is required for interprete mode.",
    });
  });

  it("finalizes unexpected judge failures instead of leaving submissions pending", async () => {
    mockedSubmissionDao.createSubmission.mockResolvedValue({
      submission_id: 10,
      problem_id: 1,
      language_id: 1,
      code: "bad config",
      status: SubmissionStatus.PENDING,
      submitted_at: new Date("2026-04-04T00:00:00.000Z"),
    });
    mockedJudgeSolution.mockRejectedValueOnce(
      new Error("Execution command cannot be empty.")
    );

    const response = await service.submitCode(1, {
      code: "bad config",
      languageId: 1,
    });

    expect(response.overallStatus).toBe(SubmissionStatus.COMPILE_ERROR);
    expect(response.results).toEqual([
      expect.objectContaining({
        status: SubmissionStatus.COMPILE_ERROR,
        phase: "compile",
        stderr: "Execution command cannot be empty.",
      }),
    ]);
    expect(mockedSubmissionDao.finalizeSubmission).toHaveBeenCalledWith(
      10,
      SubmissionStatus.COMPILE_ERROR,
      [
        expect.objectContaining({
          status: SubmissionStatus.COMPILE_ERROR,
          phase: "compile",
          stderr: "Execution command cannot be empty.",
        }),
      ]
    );
  });
});
