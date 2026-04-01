/**
 * Programming Language API Controller
 * ------------------------------------------------------
 * Provides REST endpoints to create, read, update, and delete programming languages.
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Route,
  Body,
  Path,
  Response,
  SuccessResponse,
  Tags,
} from 'tsoa';
import { LanguageService } from './language-service';
import {
  CreateLanguageRequestDto,
  UpdateLanguageRequestDto,
  LanguageDto,
} from './language';
import { ValidateError } from '../../utils/errors/validation-error';
import { NotFoundError } from '../../utils/errors/not-found-error';
import { ForbiddenError } from '../../utils/errors/forbidden-error';

@Route('languages')
@Tags('ProgrammingLanguage')
export class LanguageController extends Controller {
  private service = new LanguageService();

  /**
   * List all programming languages.
   */
  @SuccessResponse('200', 'OK')
  @Get()
  public async getLanguages(): Promise<LanguageDto[]> {
    return this.service.getAllLanguages();
  }

  /**
   * Get a programming language by its ID.
   *
   * @param id Language ID
   */
  @Response<NotFoundError>(404, 'Language not found')
  @SuccessResponse('200', 'OK')
  @Get('{id}')
  public async get(@Path() id: number): Promise<LanguageDto> {
    return this.service.getLanguageById(id);
  }

  /**
   * Create a new programming language.
   *
   * @param body Language information
   */
  @Response<ValidateError>(422, 'Validation Failed')
  @SuccessResponse('201', 'Created')
  @Post()
  public async create(
    @Body() body: CreateLanguageRequestDto,
  ): Promise<LanguageDto> {
    this.setStatus(201);
    const data = {
      name:        body.name,
      suffix:      body.suffix,
      version:     body.version ?? null,
      // Accept both camelCase and snake_case keys
      compilerCmd: body.compilerCmd ?? body.compile_command ?? null,
      runtimeCmd:  body.runtimeCmd  ?? body.run_command,
    };
    return this.service.createLanguage(data);
  }

  /**
   * Update an existing programming language.
   *
   * @param id   Language ID
   * @param body Updated language information
   */
  @Response<NotFoundError>(404, 'Language not found')
  @Response<ValidateError>(422, 'Validation Failed')
  @SuccessResponse('200', 'OK')
  @Put('{id}')
  public async update(
    @Path() id: number,
    @Body() body: UpdateLanguageRequestDto,
  ): Promise<LanguageDto> {
    const data = {
      name:        body.name,
      suffix:      body.suffix,
      version:     body.version,
      compilerCmd: body.compilerCmd ?? body.compile_command ?? null,
      runtimeCmd:  body.runtimeCmd  ?? body.run_command,
    };
    return this.service.updateLanguage(id, data);
  }

  /**
   * Delete a programming language.
   *
   * @param id Language ID
   */
  @Response<NotFoundError>(404, 'Language not found')
  @Response<ForbiddenError>(403, 'Default language cannot be deleted')
  @SuccessResponse('204', 'No Content')
  @Delete('{id}')
  public async remove(@Path() id: number): Promise<void> {
    await this.service.deleteLanguage(id);
    this.setStatus(204);
  }
}
