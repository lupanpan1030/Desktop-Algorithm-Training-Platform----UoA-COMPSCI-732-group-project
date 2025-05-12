// language.ts
export interface CreateLanguageDto {
  name: string;
  suffix: string;
  version: string | null;
  compile_command: string | null;
  run_command: string;
}

// Request body for creating a language
export class CreateLanguageRequestDto {
  /**
   * Language name (e.g., "Python")
   * @minLength 1
   * @maxLength 50
   */
  public name!: string;

  /**
   * Command used to run the compiled/interpreted program
   * @minLength 1
   */
  public runtimeCmd!: string;
  /** Optional compile command (null for interpreted languages) */
  public compilerCmd?: string | null;
  public version?: string | null;
  public suffix?: string;
}

// Request body for updating a language
export class UpdateLanguageRequestDto {
  public name?: string;
  public runtimeCmd?: string;
  public compilerCmd?: string | null;
  public version?: string | null;
  public suffix?: string;
}

export interface LanguageDto {
  languageId: number;
  name: string;
  suffix: string;          // 新增
  version: string | null;
  compile_command: string | null;
  run_command: string;
}

export interface LanguageResponseDto {
  languageId: number;
  name: string;
  suffix: string;
  version: string;
  runtimeCmd: string;
}