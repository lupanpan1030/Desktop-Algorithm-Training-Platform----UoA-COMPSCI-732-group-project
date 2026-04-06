/**
 * LanguageService — Application layer for programming languages
 * ---------------------------------------------------------------------------
 * Orchestrates business rules around programming language entities by calling
 * the DAO and converting database models to DTOs.
 */
import { LanguageDao } from './language-dao';
import { ProgrammingLanguage } from '@prisma/client';
import { LanguageDto, CreateLanguageDto } from './language';
import { NotFoundError } from '../../utils/errors/not-found-error';
import { ForbiddenError } from '../../utils/errors/forbidden-error';
import { ConflictError } from '../../utils/errors/conflict-error';
import { normalizeLanguageName, normalizeLanguageSuffix } from './language-normalization';

export class LanguageService {
  private async ensureUniqueFields(
    fields: {
      name?: string | null;
      suffix?: string | null;
    },
    ignoreId?: number
  ) {
    if (fields.name == null && fields.suffix == null) {
      return;
    }

    const languages = await LanguageDao.getAllLanguages();
    const normalizedName = normalizeLanguageName(fields.name);
    const normalizedSuffix = normalizeLanguageSuffix(fields.suffix);

    const nameConflict =
      normalizedName &&
      languages.find(
        (language) =>
          language.language_id !== ignoreId &&
          normalizeLanguageName(language.name) === normalizedName
      );

    if (nameConflict) {
      throw new ConflictError(`Language name "${fields.name?.trim()}" is already in use.`);
    }

    const suffixConflict =
      normalizedSuffix &&
      languages.find(
        (language) =>
          language.language_id !== ignoreId &&
          normalizeLanguageSuffix(language.suffix) === normalizedSuffix
      );

    if (suffixConflict) {
      throw new ConflictError(`Language suffix "${fields.suffix?.trim()}" is already in use.`);
    }
  }

  async getAllLanguages(): Promise<LanguageDto[]> {
    const langs = await LanguageDao.getAllLanguages();
    return langs.map(this.toDto);
  }

  async getLanguageById(id: number): Promise<LanguageDto> {
    const lang = await LanguageDao.findLanguageById(id);
    if (!lang) throw new NotFoundError('Language not found');
    return this.toDto(lang);
  }

  async createLanguage(data: CreateLanguageDto): Promise<LanguageDto> {
    await this.ensureUniqueFields({
      name: data.name,
      suffix: data.suffix,
    });

    try {
      const lang = await LanguageDao.createLanguage(data);
      return this.toDto(lang);
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new ConflictError('Language name or suffix is already in use');
      }
      throw err;
    }
  }

  async updateLanguage(id: number, data: Partial<CreateLanguageDto>): Promise<LanguageDto> {
    const existing = await LanguageDao.findLanguageById(id);
    if (!existing) {
      throw new NotFoundError('Language not found');
    }

    await this.ensureUniqueFields(
      {
        name: data.name,
        suffix: data.suffix,
      },
      id
    );

    try {
      const lang = await LanguageDao.updateLanguage(id, data);
      return this.toDto(lang);
    } catch (err: any) {
      if (err.code === 'P2025') throw new NotFoundError('Language not found');
      if (err.code === 'P2002') throw new ConflictError('Language name or suffix is already in use');
      throw err;
    }
  }

  async deleteLanguage(id: number): Promise<void> {
    // 1️ Fetch the language record first
    const lang = await LanguageDao.findLanguageById(id);
    if (!lang) throw new NotFoundError('Language not found');

    // 2️ Disallow deletion if it's a default language
    if ((lang as any).is_default) {
      throw new ForbiddenError('Default language cannot be deleted');
    }

    // 3️ Proceed with normal deletion
    try {
      await LanguageDao.deleteLanguage(id);
    } catch (err: any) {
      if (err.code === 'P2025') throw new NotFoundError('Language not found');
      throw err;
    }
  }

  /**
   * Convert Prisma model to API DTO.
   */
  private toDto = (lang: ProgrammingLanguage): LanguageDto => ({
    languageId:  lang.language_id,
    name:        lang.name,
    suffix:      lang.suffix,
    version:     lang.version ?? null,

    // canonical camelCase
    compilerCmd: lang.compile_command ?? null,
    runtimeCmd:  lang.run_command,

    // legacy aliases (read‑only)
    compile_command: lang.compile_command ?? null,
    run_command:     lang.run_command,
    isDefault:       lang.is_default,
  });
}
