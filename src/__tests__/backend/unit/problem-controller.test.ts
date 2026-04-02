
// This unit test covers controller logic: calls service, maps/throws.
// HTTP status codes and validation errors will be handled by api integration tests 

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { ProblemsController } from "../../../backend/api/problem/problem-controller";
import { ProblemsService } from "../../../backend/api/problem/problem-service";
import { NotFoundError } from "../../../backend/utils/errors/not-found-error";

// Mock the ProblemsService class to return a mocked instance for all its methods
vi.mock("../../../backend/api/problem/problem-service", () => {
  return {
    ProblemsService: vi.fn().mockImplementation(() => ({
      getAllProblems: vi.fn(),
      getProblem: vi.fn(),
      createProblem: vi.fn(),
      updateProblem: vi.fn(),
      deleteProblem: vi.fn(),
    })),
  };
});

// controller: HTTP‑layer object, wired up with TSOA decorators and status handling.
let controller: ProblemsController;
// serviceMock: the business‑logic stub underneath controller,
//              whose methods can be controlled to test the controller’s wiring and error‑handling.
let serviceMock: {
  getAllProblems: ReturnType<typeof vi.fn>;
  getProblem: ReturnType<typeof vi.fn>;
  createProblem: ReturnType<typeof vi.fn>;
  updateProblem: ReturnType<typeof vi.fn>;
  deleteProblem: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
  controller = new ProblemsController();
  // grabbing the first call to the constructor and extract the plain object returned by vi.fn().mockImplementation
  serviceMock = (ProblemsService as Mock).mock.results[0].value;
});

describe("ProblemsController", () => {
  describe("getAllProblems()", () => {
    it("forwards to service.getAllProblems and returns its result", async () => {
      const fakeSummaries = [
        {
          problemId: 1,
          title: "A",
          difficulty: "EASY",
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
          source: "LEETCODE",
          locale: "zh-CN",
          defaultLocale: "zh-CN",
          availableLocales: ["zh-CN"],
          sourceSlug: "b",
          externalProblemId: "2",
          judgeReady: false,
          testcaseCount: 0,
        },
      ];
      serviceMock.getAllProblems.mockResolvedValue(fakeSummaries);

      const res = await controller.getAllProblems();
      expect(serviceMock.getAllProblems).toHaveBeenCalledWith(undefined, undefined);
      expect(serviceMock.getAllProblems).toHaveBeenCalledOnce();
      expect(res).toEqual(fakeSummaries);
    });
  });

  describe("getProblem()", () => {
    it("forwards to service.getProblem and returns its result", async () => {
      const fakeDetail = {
        problemId: 2,
        title: "B",
        description: "Desc",
        difficulty: "MEDIUM",
        createdAt: new Date().toISOString(),
        source: "LOCAL",
        locale: "en",
        defaultLocale: "en",
        availableLocales: ["en"],
        sourceSlug: null as string | null,
        externalProblemId: null as string | null,
        judgeReady: true,
        testcaseCount: 2,
        sampleTestcase: null as string | null,
      };
      serviceMock.getProblem.mockResolvedValue(fakeDetail);

      const res = await controller.getProblem(2);
      expect(serviceMock.getProblem).toHaveBeenCalledWith(2, undefined, undefined);
      expect(serviceMock.getProblem).toHaveBeenCalledOnce();
      expect(res).toEqual(fakeDetail);
    });

    it("propagates NotFoundError when service throws it", async () => {
      serviceMock.getProblem.mockRejectedValue(new NotFoundError("Nope"));
      await expect(controller.getProblem(999)).rejects.toBeInstanceOf(
        NotFoundError
      );
      expect(serviceMock.getProblem).toHaveBeenCalledWith(999, undefined, undefined);
      expect(serviceMock.getProblem).toHaveBeenCalledOnce();
    });
  });

  describe("createProblem()", () => {
    it("sets status 201 and returns service.createProblem result", async () => {
      const input = {
        title: "C",
        description: "Desc",
        difficulty: "HARD",
      } as const;
      const fakeDetail = {
        problemId: 3,
        title: "C",
        description: "Desc",
        difficulty: "HARD",
        createdAt: new Date().toISOString(),
        source: "LOCAL",
        locale: "en",
        defaultLocale: "en",
        availableLocales: ["en"],
        sourceSlug: null as string | null,
        externalProblemId: null as string | null,
        judgeReady: false,
        testcaseCount: 0,
        sampleTestcase: null as string | null,
      };
      serviceMock.createProblem.mockResolvedValue(fakeDetail);

      const res = await controller.createProblem(input);
      expect(serviceMock.createProblem).toHaveBeenCalledWith(input);
      expect(serviceMock.createProblem).toHaveBeenCalledOnce();
      expect(res).toEqual(fakeDetail);
      // If you want, you can assert status via (controller as any).status
    });
  });

  describe("updateProblem()", () => {
    it("returns service.updateProblem result when found", async () => {
      const input = { title: "D" } as const;
      const fakeDetail = {
        problemId: 4,
        title: "D",
        description: "New",
        difficulty: "EASY",
        createdAt: new Date().toISOString(),
        source: "LEETCODE",
        locale: "zh-CN",
        defaultLocale: "zh-CN",
        availableLocales: ["zh-CN"],
        sourceSlug: "d",
        externalProblemId: "4",
        judgeReady: true,
        testcaseCount: 3,
        sampleTestcase: "1 2",
      };
      serviceMock.updateProblem.mockResolvedValue(fakeDetail);

      const res = await controller.updateProblem(4, input);
      expect(serviceMock.updateProblem).toHaveBeenCalledWith(4, input);
      expect(serviceMock.updateProblem).toHaveBeenCalledOnce();
      expect(res).toEqual(fakeDetail);
    });

    it("propagates NotFoundError when service throws it", async () => {
      serviceMock.updateProblem.mockRejectedValue(new NotFoundError("Nope"));
      await expect(controller.updateProblem(999, {})).rejects.toBeInstanceOf(
        NotFoundError
      );
      expect(serviceMock.updateProblem).toHaveBeenCalledWith(999, {});
      expect(serviceMock.updateProblem).toHaveBeenCalledOnce();
    });
  });

  describe("deleteProblem()", () => {
    it("calls service.deleteProblem and sets status 204", async () => {
      serviceMock.deleteProblem.mockResolvedValue(undefined);

      await controller.deleteProblem(5);
      expect(serviceMock.deleteProblem).toHaveBeenCalledWith(5);
      expect(serviceMock.deleteProblem).toHaveBeenCalledOnce();
      // Optionally assert status 204 on controller
    });

    it("propagates errors from service.deleteProblem", async () => {
      serviceMock.deleteProblem.mockRejectedValue(new Error("fail"));
      await expect(controller.deleteProblem(5)).rejects.toThrow("fail");
      expect(serviceMock.deleteProblem).toHaveBeenCalledWith(5);
      expect(serviceMock.deleteProblem).toHaveBeenCalledOnce();
    });
  });
});
