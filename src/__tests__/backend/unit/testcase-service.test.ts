import { describe, it, expect, vi, beforeEach } from "vitest";
import { TestCaseService } from "../../../backend/api/testcase/testcase-service";
import type { CreateTestCaseParams } from "../../../backend/api/testcase/testcase";

// ────────────────────────────────────────────────────────────
//   Mock the DAO layer so we can test the service in isolation
//   All DAO functions become vi.fn() spies we can assert on.
// ────────────────────────────────────────────────────────────
vi.mock("../../../backend/api/testcase/testcase-dao", () => ({
  TestCaseDao: {
    getTestCasesByProblem: vi.fn(),
    createTestCase: vi.fn(),
    deleteTestCase: vi.fn(),
  },
}));

// Type helper: make TS treat the mocked DAO as a real object
import { TestCaseDao } from "../../../backend/api/testcase/testcase-dao";
const mockedDao = vi.mocked(TestCaseDao);

// ────────────────────────────────────────────────────────────
// Test suite
// ────────────────────────────────────────────────────────────
describe("TestCaseService", () => {
  const service = new TestCaseService();

  // reset spies between tests
  beforeEach(() => vi.clearAllMocks());

  // ── getTestCases ──────────────────────────────────────────
  describe("getTestCases()", () => {
    it("delegates to DAO and maps rows to DTOs", async () => {
      mockedDao.getTestCasesByProblem.mockResolvedValue([
        {
          testcase_id: 7,
          problem_id: 1,
          input_data: "[1,2], 3",
          expected_output: "[0,1]",
          time_limit_ms: 1_000,
          memory_limit_mb: 128,
        },
      ]);

      const result = await service.getTestCases(1);

      expect(mockedDao.getTestCasesByProblem).toHaveBeenCalledWith(1);
      expect(result).toEqual([
        {
          testcaseId: 7,
          input: "[1,2], 3",
          expectedOutput: "[0,1]",
          timeLimitMs: 1_000,
          memoryLimitMb: 128,
        },
      ]);
    });
  });

  // ── createTestCase ───────────────────────────────────────
  describe("createTestCase()", () => {
    it("passes args through to DAO and returns mapped entity", async () => {
      const daoReturn = {
        testcase_id: 9,
        problem_id: 5,
        input_data: 's = "abba"',
        expected_output: "abba",
        time_limit_ms: 2_000,
        memory_limit_mb: 256,
      };
      mockedDao.createTestCase.mockResolvedValue(daoReturn);

      const params: CreateTestCaseParams = {
        input: daoReturn.input_data,
        expectedOutput: daoReturn.expected_output,
        timeLimitMs: daoReturn.time_limit_ms,
        memoryLimitMb: daoReturn.memory_limit_mb,
      };

      const created = await service.createTestCase(5, params);

      expect(mockedDao.createTestCase).toHaveBeenCalledWith(5, params);
      expect(created).toEqual({
        testcaseId: 9,
        input: 's = "abba"',
        expectedOutput: "abba",
        timeLimitMs: 2_000,
        memoryLimitMb: 256,
      });
    });
  });

  // ── deleteTestCase ───────────────────────────────────────
  describe("deleteTestCase()", () => {
    it("calls DAO.deleteTestCase with correct ids", async () => {
      mockedDao.deleteTestCase.mockResolvedValue(undefined);
      await service.deleteTestCase(1, 42);
      expect(mockedDao.deleteTestCase).toHaveBeenCalledWith(1, 42);
    });
  });
});