/**
 * LanguageService — Application layer for programming languages (语言应用服务层)
 * ---------------------------------------------------------------------------
 * Orchestrates business rules around programming language entities by calling
 * the DAO and converting database models to DTOs.
 * 该服务调用 DAO 并将数据库模型转换为 DTO，封装业务规则。
 */
import { LanguageDao } from './language-dao';
import { ProgrammingLanguage } from '@prisma/client';
import { LanguageDto, CreateLanguageDto } from './language';
import { NotFoundError } from '../../utils/errors/not-found-error';
import { ForbiddenError } from '../../utils/errors/forbidden-error';

export class LanguageService {
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
    const lang = await LanguageDao.createLanguage(data);
    return this.toDto(lang);
  }

  async updateLanguage(id: number, data: Partial<CreateLanguageDto>): Promise<LanguageDto> {
    try {
      const lang = await LanguageDao.updateLanguage(id, data);
      return this.toDto(lang);
    } catch (err: any) {
      if (err.code === 'P2025') throw new NotFoundError('Language not found');
      throw err;
    }
  }

  async deleteLanguage(id: number): Promise<void> {
    // 1️ Fetch the language record first (先拿到语言记录)
    const lang = await LanguageDao.findLanguageById(id);
    if (!lang) throw new NotFoundError('Language not found');

    // 2️ Disallow deletion if it's a default language (如果是默认语言则禁止删除)
    if ((lang as any).is_default) {
      throw new ForbiddenError('Default language cannot be deleted');
    }

    // 3️ Proceed with normal deletion (正常删除)
    try {
      await LanguageDao.deleteLanguage(id);
    } catch (err: any) {
      if (err.code === 'P2025') throw new NotFoundError('Language not found');
      throw err;
    }
  }

  /**
   * Convert Prisma model to API DTO.
   * 将 Prisma 模型转换为 API DTO。
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
  });
}