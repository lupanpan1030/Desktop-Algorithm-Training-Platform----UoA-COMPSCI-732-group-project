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
@Route('language')
@Tags('ProgrammingLanguage')
export class LanguageController extends Controller {
    @Get('/')
    public async getLanguages(): Promise<ProgrammingLanguage[]> {
        return service.getAllLanguages();
    }

    @Post('/')
    public async create(@Body() body: CreateLanguageDto): Promise<ProgrammingLanguage> {
        return service.createLanguage(body);
    }

    @Put('{id}')
    public async update(
        @Path() id: number,
        @Body() body: Partial<CreateLanguageDto>
    ): Promise<ProgrammingLanguage> {
        return service.updateLanguage(id, body);
    }

    @Delete('{id}')
    public async remove(@Path() id: number): Promise<void> {
        return service.deleteLanguage(id);
    }
}
