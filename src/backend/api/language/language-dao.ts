// language-dao.ts — Data Access Layer for ProgrammingLanguage
import type { ProgrammingLanguage } from '@prisma/client';
import { getPrisma } from '../../db/prisma/prisma';
import { CreateLanguageDto } from './language';

/**
 * DAO for the `programmingLanguage` table.
 * Mirrors the static‑class style used by ProblemsDao/TestCaseDao so tests can
 * swap the Prisma client via `getPrisma()`.
 */
export class LanguageDao {
  /** Always returns the current Prisma Client (allows tests to inject one). */
  private static get db() {
    return getPrisma();
  }

  /** List all languages */
  public static async getAllLanguages(): Promise<ProgrammingLanguage[]> {
    return this.db.programmingLanguage.findMany();
  }

  /** Find a single language by primary key */
  public static async findLanguageById(
    id: number,
  ): Promise<ProgrammingLanguage | null> {
    return this.db.programmingLanguage.findUnique({
      where: { language_id: id },
    });
  }

  /** Insert a new language */
  public static async createLanguage(
    data: CreateLanguageDto,
  ): Promise<ProgrammingLanguage> {
    const { compilerCmd, runtimeCmd, ...rest } = data;
    return this.db.programmingLanguage.create({
      data: {
        ...rest,
        compile_command: compilerCmd ?? null, // map camelCase → snake_case
        run_command: runtimeCmd ?? null,
      },
    });
  }

  /** Update an existing language */
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

  /** Delete a language */
  public static async deleteLanguage(id: number): Promise<void> {
    await this.db.programmingLanguage.delete({
      where: { language_id: id },
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Legacy functional exports (kept to avoid breaking older imports)           */
/* -------------------------------------------------------------------------- */

export const getAllLanguages = () => LanguageDao.getAllLanguages();
export const findLanguageById = (id: number) => LanguageDao.findLanguageById(id);
export const createLanguage = (data: CreateLanguageDto) =>
  LanguageDao.createLanguage(data);
export const updateLanguage = (
  id: number,
  data: Partial<CreateLanguageDto>,
) => LanguageDao.updateLanguage(id, data);
export const deleteLanguage = (id: number) => LanguageDao.deleteLanguage(id);