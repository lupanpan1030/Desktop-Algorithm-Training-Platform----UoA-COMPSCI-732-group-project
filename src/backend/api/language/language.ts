/**
 * Language DTO definitions (语言 DTO 定义)
 * -------------------------------------
 * Contains all data‑transfer objects used by the Programming Language API,
 * including create/update request bodies and response models.
 * 包含编程语言 API 使用的所有数据传输对象，如创建/更新请求体和响应模型。
 */

// DTO used internally when creating a language (创建语言时的内部 DTO)
export interface CreateLanguageDto {
  name: string;
  suffix: string;
  version: string | null;
  compilerCmd: string | null;
  runtimeCmd: string;
}

// Request body for creating a language (创建语言的请求体)
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

// Request body for updating a language (更新语言的请求体)
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

// Response model returned to clients (返回给客户端的响应模型)
export interface LanguageDto {
  languageId: number;
  name: string;
  suffix: string;          // File suffix, new in v2 (文件后缀，v2 新增)
  version: string | null;
  compilerCmd: string | null;
  runtimeCmd: string;
  /** @deprecated alias for compilerCmd */
  compile_command?: string | null;
  /** @deprecated alias for runtimeCmd */
  run_command?: string;
  isDefault: boolean;
}

// Simplified response for listings (列表使用的简化响应模型)
export interface LanguageResponseDto {
  languageId: number;
  name: string;
  suffix: string;
  version: string;
  compilerCmd: string | null;
  runtimeCmd: string;
  isDefault: boolean;
}