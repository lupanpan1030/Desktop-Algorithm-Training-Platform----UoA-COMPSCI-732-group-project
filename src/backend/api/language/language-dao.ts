/**
 * LanguageDao — Data Access Layer for ProgrammingLanguage 表
 * ----------------------------------------------------------
 * Provides database helpers to create, read, update and delete programming
 * languages using Prisma. 通过 Prisma 提供编程语言的增删改查数据库操作。
 */
import type { ProgrammingLanguage } from '@prisma/client';
import { getPrisma } from '../../db/prisma/prisma';
import { CreateLanguageDto } from './language';

/**
 * DAO for the `programmingLanguage` table.
 * 该类封装对 `programmingLanguage` 表的所有操作。
 *
 * Mirrors the static‑class style used by ProblemsDao/TestCaseDao so tests can
 * swap the Prisma client via `getPrisma()`.
 * 与 ProblemsDao/TestCaseDao 保持相同的静态类风格，方便测试替换 Prisma Client。
 */
export class LanguageDao {
  /** Always returns the current Prisma Client (用于测试注入). */
  private static get db() {
    return getPrisma();
  }

  /** List all programming languages. 列出所有编程语言。 */
  public static async getAllLanguages(): Promise<ProgrammingLanguage[]> {
    return this.db.programmingLanguage.findMany();
  }

  /** Find a language by primary key. 根据主键查询语言。 */
  public static async findLanguageById(
    id: number,
  ): Promise<ProgrammingLanguage | null> {
    return this.db.programmingLanguage.findUnique({
      where: { language_id: id },
    });
  }

  /** Insert a new language. 插入新语言。 */
  public static async createLanguage(
    data: CreateLanguageDto,
  ): Promise<ProgrammingLanguage> {
    const { compilerCmd, runtimeCmd, ...rest } = data;
    return this.db.programmingLanguage.create({
      data: {
        ...rest,
        compile_command: compilerCmd ?? null, // Map camelCase → snake_case 字段
        run_command: runtimeCmd ?? null,
      },
    });
  }

  /** Update an existing language. 更新已有语言。 */
  public static async updateLanguage(
    id: number,
    data: Partial<CreateLanguageDto>,
  ): Promise<ProgrammingLanguage> {
    const { compilerCmd, runtimeCmd, ...rest } = data;
    return this.db.programmingLanguage.update({
      where: { language_id: id },
      data: {
        ...rest,
        ...(compilerCmd !== undefined && { compile_command: compilerCmd }),
        ...(runtimeCmd  !== undefined && { run_command:  runtimeCmd }),
      },
    });
  }

  /** Delete a language. 删除语言。 */
  public static async deleteLanguage(id: number): Promise<void> {
    await this.db.programmingLanguage.delete({
      where: { language_id: id },
    });
  }
}

/* ------------------------------------------------------------------ */
/* Legacy functional exports (保留旧版函数式导出以避免破坏现有引用) */
/* ------------------------------------------------------------------ */

export const getAllLanguages = () => LanguageDao.getAllLanguages();
export const findLanguageById = (id: number) => LanguageDao.findLanguageById(id);
export const createLanguage = (data: CreateLanguageDto) =>
  LanguageDao.createLanguage(data);
export const updateLanguage = (
  id: number,
  data: Partial<CreateLanguageDto>,
) => LanguageDao.updateLanguage(id, data);
export const deleteLanguage = (id: number) => LanguageDao.deleteLanguage(id);