// language-controller.ts
import {
    Body,
    Controller,
    Delete,
    Get,
    Path,
    Post,
    Put,
    Route,
    Tags,
} from 'tsoa';
import { ProgrammingLanguage, CreateLanguageDto } from './language';
import { LanguageService } from './language-service';

const service = new LanguageService();

// 编程语言 API 控制器
// Programming Language API Controller
@Route('language')
@Tags('ProgrammingLanguage')
export class LanguageController extends Controller {
    // 获取所有编程语言
    // Get all programming languages
    @Get('/')
    public async getLanguages(): Promise<ProgrammingLanguage[]> {
        return service.getAllLanguages();
    }

    // 创建新的编程语言
    // Create a new programming language
    @Post('/')
    public async create(@Body() body: CreateLanguageDto): Promise<ProgrammingLanguage> {
        return service.createLanguage(body);
    }

    // 更新编程语言（根据 ID）
    // Update a programming language by ID
    @Put('{id}')
    public async update(
        @Path() id: number,                           
        @Body() body: Partial<CreateLanguageDto> 
    ): Promise<ProgrammingLanguage> {
        return service.updateLanguage(id, body);
    }

    // 删除编程语言（根据 ID）
    // Delete a programming language by ID
    @Delete('{id}')
    public async remove(@Path() id: number): Promise<void> {
        return service.deleteLanguage(id);
    }
}

