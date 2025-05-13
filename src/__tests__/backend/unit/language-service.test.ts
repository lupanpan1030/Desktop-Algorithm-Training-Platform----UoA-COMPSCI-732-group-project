import { describe, it, expect, beforeEach, vi } from "vitest";
import { LanguageService } from "../../../backend/api/language/language-service";
import { LanguageDao } from "../../../backend/api/language/language-dao";
import { NotFoundError } from "../../../backend/utils/errors/not-found-error";
import { ForbiddenError } from "../../../backend/utils/errors/forbidden-error";

// --- vi.mock 必须放在 import 语句之后，*但* 在执行代码之前 ------------------
// Mock the entire LanguageDao module so that all calls are intercepted.
// 把 LanguageDao 的五个静态方法全部替换成 vi.fn()，方便逐个定制返回值
vi.mock("../../../backend/api/language/language-dao", () => {
  return {
    LanguageDao: {
      getAllLanguages: vi.fn(),
      findLanguageById: vi.fn(),
      createLanguage: vi.fn(),
      updateLanguage: vi.fn(),
      deleteLanguage: vi.fn(),
    },
  };
});

// 方便在测试里拿到强类型的 mock
const mockedDao = LanguageDao as unknown as {
  getAllLanguages: ReturnType<typeof vi.fn>;
  findLanguageById: ReturnType<typeof vi.fn>;
  createLanguage: ReturnType<typeof vi.fn>;
  updateLanguage: ReturnType<typeof vi.fn>;
  deleteLanguage: ReturnType<typeof vi.fn>;
};

// 用固定的数据构造一个“数据库行”——Prisma 模型里的字段名
const fakeRow = {
  language_id: 1,
  name: "Python",
  suffix: "py",
  version: "3.12",
  compile_command: null,
  run_command: "python",
  is_default: false,
};

// 预期返回给客户端的 DTO（camelCase + legacy alias）
const expectedDto = {
  languageId: 1,
  name: "Python",
  suffix: "py",
  version: "3.12",
  compilerCmd: null,
  runtimeCmd: "python",
  compile_command: null,
  run_command: "python",
};

describe("LanguageService", () => {
  const service = new LanguageService();

  beforeEach(() => {
    // 保证每个测试开始前 mock 都是干净的
    vi.clearAllMocks();
  });

  it("getAllLanguages → maps rows to DTOs", async () => {
    mockedDao.getAllLanguages.mockResolvedValue([fakeRow]);

    const langs = await service.getAllLanguages();

    expect(mockedDao.getAllLanguages).toHaveBeenCalledOnce();
    expect(langs).toEqual([expectedDto]);
  });

  it("getLanguageById → returns DTO when found", async () => {
    mockedDao.findLanguageById.mockResolvedValue(fakeRow);

    const lang = await service.getLanguageById(1);

    expect(mockedDao.findLanguageById).toHaveBeenCalledWith(1);
    expect(lang).toEqual(expectedDto);
  });

  it("getLanguageById → throws NotFoundError when missing", async () => {
    mockedDao.findLanguageById.mockResolvedValue(undefined);

    await expect(() => service.getLanguageById(42)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("createLanguage → passes data through to DAO and maps result", async () => {
    mockedDao.createLanguage.mockResolvedValue(fakeRow);

    const body = {
      name: "Python",
      suffix: "py",
      version: "3.12",
      compilerCmd: null,
      runtimeCmd: "python",
    };

    const created = await service.createLanguage(body);

    expect(mockedDao.createLanguage).toHaveBeenCalledWith(body);
    expect(created).toEqual(expectedDto);
  });

  it("updateLanguage → returns updated DTO", async () => {
    const updatedRow = { ...fakeRow, version: "3.13" };
    mockedDao.updateLanguage.mockResolvedValue(updatedRow);

    const updated = await service.updateLanguage(1, { version: "3.13" });

    expect(mockedDao.updateLanguage).toHaveBeenCalledWith(1, { version: "3.13" });
    expect(updated.version).toBe("3.13");
  });

  it("updateLanguage → throws NotFoundError when DAO rejects with P2025", async () => {
    const err = Object.assign(new Error("not found"), { code: "P2025" });
    mockedDao.updateLanguage.mockRejectedValue(err);

    await expect(service.updateLanguage(99, {})).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deleteLanguage → forbids deleting default language", async () => {
    mockedDao.findLanguageById.mockResolvedValue({ ...fakeRow, is_default: true });

    await expect(service.deleteLanguage(1)).rejects.toBeInstanceOf(ForbiddenError);
    expect(mockedDao.deleteLanguage).not.toHaveBeenCalled();
  });

  it("deleteLanguage → calls DAO when language is deletable", async () => {
    mockedDao.findLanguageById.mockResolvedValue(fakeRow);
    mockedDao.deleteLanguage.mockResolvedValue(undefined);

    await service.deleteLanguage(1);

    expect(mockedDao.deleteLanguage).toHaveBeenCalledWith(1);
  });

  it("deleteLanguage → throws NotFoundError when DAO rejects with P2025", async () => {
    mockedDao.findLanguageById.mockResolvedValue(fakeRow);
    const err = Object.assign(new Error(), { code: "P2025" });
    mockedDao.deleteLanguage.mockRejectedValue(err);

    await expect(service.deleteLanguage(1)).rejects.toBeInstanceOf(NotFoundError);
  });
});