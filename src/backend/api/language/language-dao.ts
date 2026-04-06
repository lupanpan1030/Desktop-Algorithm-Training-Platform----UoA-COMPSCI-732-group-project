/**
 * LanguageDao — Data Access Layer for ProgrammingLanguage
 * ----------------------------------------------------------
 * Provides database helpers to create, read, update and delete programming
 * languages using Prisma. 
 */
import type { ProgrammingLanguage } from '@prisma/client';
import { getPrisma } from '../../db/prisma/prisma';
import { CreateLanguageDto } from './language';
import { normalizeLanguageName, normalizeLanguageSuffix } from './language-normalization';

export class LanguageDao {
  /** Always returns the current Prisma Client */
  private static get db() {
    return getPrisma();
  }

  /** List all programming languages. */
  public static async getAllLanguages(): Promise<ProgrammingLanguage[]> {
    return this.db.programmingLanguage.findMany();
  }

  /** Find a language by primary key. */
  public static async findLanguageById(
    id: number,
  ): Promise<ProgrammingLanguage | null> {
    return this.db.programmingLanguage.findUnique({
      where: { language_id: id },
    });
  }

  /** Insert a new language. */
  public static async createLanguage(
    data: CreateLanguageDto,
  ): Promise<ProgrammingLanguage> {
    const { compilerCmd, runtimeCmd, ...rest } = data;
    return this.db.programmingLanguage.create({
      data: {
        ...rest,
        normalized_name: normalizeLanguageName(data.name),
        normalized_suffix: normalizeLanguageSuffix(data.suffix),
        compile_command: compilerCmd ?? null, // Map camelCase → snake_case
        run_command: runtimeCmd ?? null,
      },
    });
  }

  /** Update an existing language. */
  public static async updateLanguage(
    id: number,
    data: Partial<CreateLanguageDto>,
  ): Promise<ProgrammingLanguage> {
    const { compilerCmd, runtimeCmd, ...rest } = data;
    return this.db.programmingLanguage.update({
      where: { language_id: id },
      data: {
        ...rest,
        ...(data.name !== undefined && {
          normalized_name: normalizeLanguageName(data.name),
        }),
        ...(data.suffix !== undefined && {
          normalized_suffix: normalizeLanguageSuffix(data.suffix),
        }),
        ...(compilerCmd !== undefined && { compile_command: compilerCmd }),
        ...(runtimeCmd  !== undefined && { run_command:  runtimeCmd }),
      },
    });
  }

  /** Delete a language. */
  public static async deleteLanguage(id: number): Promise<void> {
    await this.db.programmingLanguage.delete({
      where: { language_id: id },
    });
  }
}

/* ------------------------------------------------------------------ */
/* Legacy functional exports */
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
