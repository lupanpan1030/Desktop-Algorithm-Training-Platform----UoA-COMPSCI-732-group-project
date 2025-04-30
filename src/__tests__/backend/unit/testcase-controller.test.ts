import { describe, it, expect, vi, beforeEach } from "vitest";
import { TestCaseController } from "../../../backend/api/testcase/testcase-controller";

// ────────────────────────────────────────────────────────────
//    Mock the service layer so we can test the controller alone
// ────────────────────────────────────────────────────────────

const serviceMock = {
  getTestCases: vi.fn(),
  createTestCase: vi.fn(),
  deleteTestCase: vi.fn(),
};

vi.mock("../../../backend/api/testcase/testcase-service", () => ({
  TestCaseService: vi.fn(() => serviceMock),
}));

// ────────────────────────────────────────────────────────────
// Test suite
// ────────────────────────────────────────────────────────────
describe("TestCaseController", () => {
  let controller: TestCaseController;

  // fresh controller & clean mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
    controller = new TestCaseController();
  });

  // ── getTestCases ──────────────────────────────────────────
  describe("getTestCases()", () => {
    it("delegates to service and returns its result", async () => {
      serviceMock.getTestCases.mockResolvedValue([
        { testcaseId: 1, input: "1", expectedOutput: "1" },
        { testcaseId: 2, input: "2", expectedOutput: "2" },
      ]);

      const result = await controller.getTestCases(42);

      expect(serviceMock.getTestCases).toHaveBeenCalledWith(42);
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { testcaseId: 1, input: "1", expectedOutput: "1" },
        { testcaseId: 2, input: "2", expectedOutput: "2" },
      ]);
    });
  });

  // ── createTestCase ───────────────────────────────────────
  describe("createTestCase()", () => {
    it("returns the created entity", async () => {
      const params = {
        input: "2 3",
        expectedOutput: "5",
        timeLimitMs: 1000,
        memoryLimitMb: 128,
      };
      const created = { testcaseId: 99, ...params };
      serviceMock.createTestCase.mockResolvedValue(created);

      const res = await controller.createTestCase(7, params);
      expect(serviceMock.createTestCase).toHaveBeenCalledWith(7, params);
      expect(res).toEqual(created);
    });
  });

  // ── deleteTestCase ───────────────────────────────────────
  describe("deleteTestCase()", () => {
    it("invokes service deletion", async () => {
      serviceMock.deleteTestCase.mockResolvedValue(undefined);

      await controller.deleteTestCase(7, 88);
      expect(serviceMock.deleteTestCase).toHaveBeenCalledWith(7, 88);
    });
  });
});
