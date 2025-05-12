// language-service.ts
import { LanguageDao } from './language-dao';
import { ProgrammingLanguage } from '@prisma/client';
import { LanguageDto, CreateLanguageDto } from './language';
import { NotFoundError } from '../../utils/errors/not-found-error';

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
    try {
      await LanguageDao.deleteLanguage(id);
    } catch (err: any) {
      if (err.code === 'P2025') throw new NotFoundError('Language not found');
      throw err;
    }
  }

  private toDto = (lang: ProgrammingLanguage): LanguageDto => ({
    languageId:  lang.language_id,
    name:        lang.name,
    suffix:      lang.suffix,
    version:     lang.version ?? null,
    compile_command: lang.compile_command ?? null,
    run_command:  lang.run_command,
  });
}