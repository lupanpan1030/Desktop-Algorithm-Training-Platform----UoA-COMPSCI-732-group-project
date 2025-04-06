// language-service.ts
import * as LanguageDao from './language-dao';
import { ProgrammingLanguage, CreateLanguageDto } from './language';

// 编程语言业务逻辑服务类
// Service class for handling programming language logic
export class LanguageService {
  // 获取所有编程语言
  // Get all programming languages
    async getAllLanguages(): Promise<ProgrammingLanguage[]> {
        const langs = await LanguageDao.getAllLanguages();
        return langs.map((lang) => ({
        language_id: lang.language_id,
        name: lang.name,
        suffix: lang.suffix,
        version: lang.version,
        compile_command: lang.compile_command,
        run_command: lang.run_command
        }));
    }

    // 根据 ID 获取编程语言
    // Get a programming language by ID
    async getLanguageById(id: number): Promise<ProgrammingLanguage> {
        const lang = await LanguageDao.findLanguageById(id);
        if (!lang) throw new Error('Language not found');  // 未找到时抛出错误 / Throw error if not found
        return lang;
    }

    // 创建新的编程语言
    // Create a new programming language
    async createLanguage(data: CreateLanguageDto): Promise<ProgrammingLanguage> {
        return await LanguageDao.createLanguage(data);
    }

    // 更新指定 ID 的编程语言
    // Update a programming language by ID
    async updateLanguage(id: number, data: Partial<CreateLanguageDto>): Promise<ProgrammingLanguage> {
        const existing = await this.getLanguageById(id);
        if (!existing) throw new Error('Language not found');  // 未找到则抛出 / Throw if not found
        return await LanguageDao.updateLanguage(id, data);
    }

    // 删除指定 ID 的编程语言
    // Delete a programming language by ID
    async deleteLanguage(id: number): Promise<void> {
        try {
        await LanguageDao.deleteLanguage(id);
        } catch (error: any) {
        if (error.code === 'P2025') {
            throw new Error('Language not found');  // 删除失败 / Deletion failed
        }
        throw error;
        }
    }
}

