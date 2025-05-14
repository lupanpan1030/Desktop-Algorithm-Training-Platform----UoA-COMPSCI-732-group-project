// Unit tests for LanguageController
// ---------------------------------
// 仅测试 controller-service 的交互逻辑；HTTP status & validation 由集成测试覆盖。

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

import { LanguageController } from "../../../backend/api/language/language-controller";
import { LanguageService } from "../../../backend/api/language/language-service";
import { NotFoundError } from "../../../backend/utils/errors/not-found-error";
import { ForbiddenError } from "../../../backend/utils/errors/forbidden-error";

// 1️⃣  mock 掉 LanguageService —— 每实例化一次都会拿到一组 vi.fn()
vi.mock("../../../backend/api/language/language-service", () => ({
  LanguageService: vi.fn().mockImplementation(() => ({
    getAllLanguages: vi.fn(),
    getLanguageById: vi.fn(),
    createLanguage: vi.fn(),
    updateLanguage: vi.fn(),
    deleteLanguage: vi.fn(),
  })),
}));

// 2️⃣  待测对象 & 对应的 service stub
let controller: LanguageController;
let serviceMock: {
  getAllLanguages: ReturnType<typeof vi.fn>;
  getLanguageById: ReturnType<typeof vi.fn>;
  createLanguage: ReturnType<typeof vi.fn>;
  updateLanguage: ReturnType<typeof vi.fn>;
  deleteLanguage: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
  controller = new LanguageController();
  // 取到当前 controller 内的那一份 service stub
  serviceMock = (LanguageService as unknown as Mock).mock.results[0].value;
});

describe("LanguageController", () => {
  /* ------------ GET /languages ------------ */
  describe("getLanguages()", () => {
    it("delegates to service.getAllLanguages and returns its result", async () => {
      const fakeList: Array<{
        languageId: number;
        name: string;
        suffix: string;
        version: string;
        compilerCmd: string | null;
        runtimeCmd: string | null;
      }> = [
        {
          languageId: 1,
          name: "Python",
          suffix: "py",
          version: "3.11",
          compilerCmd: null,
          runtimeCmd: "python",
        },
      ];
      serviceMock.getAllLanguages.mockResolvedValue(fakeList);

      const res = await controller.getLanguages();
      expect(serviceMock.getAllLanguages).toHaveBeenCalledOnce();
      expect(res).toEqual(fakeList);
    });
  });

  /* ------------ GET /languages/{id} ------------ */
  describe("get()", () => {
    it("returns service.getLanguageById result", async () => {
      const fakeLang = {
        languageId: 2,
        name: "Go",
        suffix: "go",
        version: "1.22",
        compilerCmd: "go build",
        runtimeCmd: "go run",
      };
      serviceMock.getLanguageById.mockResolvedValue(fakeLang);

      const res = await controller.get(2);
      expect(serviceMock.getLanguageById).toHaveBeenCalledWith(2);
      expect(res).toEqual(fakeLang);
    });

    it("propagates NotFoundError from service", async () => {
      serviceMock.getLanguageById.mockRejectedValue(new NotFoundError("Missing"));
      await expect(controller.get(999)).rejects.toBeInstanceOf(NotFoundError);
      expect(serviceMock.getLanguageById).toHaveBeenCalledWith(999);
    });
  });

  /* ------------ POST /languages ------------ */
  describe("create()", () => {
    it("maps camel/snake fields correctly and forwards to service.createLanguage", async () => {
      const input = {
        name: "C",
        suffix: "c",
        version: "23",
        compile_command: "gcc -o main",
        run_command: "./main",
      } as const;

      const expected = {
        name: "C",
        suffix: "c",
        version: "23",
        compilerCmd: "gcc -o main",
        runtimeCmd: "./main",
      };

      const fakeResp = { languageId: 3, ...expected };
      serviceMock.createLanguage.mockResolvedValue(fakeResp);

      const res = await controller.create(input as any);
      expect(serviceMock.createLanguage).toHaveBeenCalledWith(expected);
      expect(res).toEqual(fakeResp);
    });
  });

  /* ------------ PUT /languages/{id} ------------ */
  describe("update()", () => {
    it("forwards mapped body to service.updateLanguage and returns result", async () => {
      const body = {
        name: "C++",
        suffix: "cpp",
        version: "20",
        compilerCmd: "g++ -std=c++20",
        runtimeCmd: "./a.out",
      };
      const fakeResp = { languageId: 4, ...body };
      serviceMock.updateLanguage.mockResolvedValue(fakeResp);

      const res = await controller.update(4, body as any);
      expect(serviceMock.updateLanguage).toHaveBeenCalledWith(4, body);
      expect(res).toEqual(fakeResp);
    });

    it("propagates NotFoundError from service.updateLanguage", async () => {
      serviceMock.updateLanguage.mockRejectedValue(new NotFoundError("Nope"));
      await expect(controller.update(404, {
      "compilerCmd": null,
      "name": undefined,
      "runtimeCmd": undefined,
      "suffix": undefined,
      "version": undefined,
    } as any)).rejects.toBeInstanceOf(NotFoundError);
      expect(serviceMock.updateLanguage).toHaveBeenCalledWith(404, {
      "compilerCmd": null,
      "name": undefined,
      "runtimeCmd": undefined,
      "suffix": undefined,
      "version": undefined,
    });
    });
  });

  /* ------------ DELETE /languages/{id} ------------ */
  describe("remove()", () => {
    it("calls service.deleteLanguage", async () => {
      serviceMock.deleteLanguage.mockResolvedValue(undefined);

      await controller.remove(5);
      expect(serviceMock.deleteLanguage).toHaveBeenCalledWith(5);
    });

    it("propagates ForbiddenError when trying to delete default language", async () => {
      serviceMock.deleteLanguage.mockRejectedValue(new ForbiddenError("Default language"));
      await expect(controller.remove(1)).rejects.toBeInstanceOf(ForbiddenError);
      expect(serviceMock.deleteLanguage).toHaveBeenCalledWith(1);
    });
  });
});
