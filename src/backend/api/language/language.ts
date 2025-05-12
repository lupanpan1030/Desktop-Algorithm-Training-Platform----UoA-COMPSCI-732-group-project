// language.ts
export interface CreateLanguageDto {
  name: string;
  suffix: string;
  version: string | null;
  compilerCmd: string | null;
  runtimeCmd: string;
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
  /** @deprecated legacy snake_case input; use runtimeCmd instead */
  public run_command?: string;
  /** @deprecated legacy snake_case input; use compilerCmd instead */
  public compile_command?: string | null;
  /** Optional compile command (null for interpreted languages) */
  public compilerCmd?: string | null;
  public version?: string | null;
  public suffix?: string;
}

// Request body for updating a language
export class UpdateLanguageRequestDto {
  public name?: string;
  public runtimeCmd?: string;
  /** @deprecated legacy snake_case input; use runtimeCmd instead */
  public run_command?: string;
  /** @deprecated legacy snake_case input; use compilerCmd instead */
  public compile_command?: string | null;
  public compilerCmd?: string | null;
  public version?: string | null;
  public suffix?: string;
}

export interface LanguageDto {
  languageId: number;
  name: string;
  suffix: string;          // 新增
  version: string | null;
  compilerCmd: string | null;
  runtimeCmd: string;
  /** @deprecated alias for compilerCmd */
  compile_command?: string | null;
  /** @deprecated alias for runtimeCmd */
  run_command?: string;
}

export interface LanguageResponseDto {
  languageId: number;
  name: string;
  suffix: string;
  version: string;
  compilerCmd: string | null;
  runtimeCmd: string;
}