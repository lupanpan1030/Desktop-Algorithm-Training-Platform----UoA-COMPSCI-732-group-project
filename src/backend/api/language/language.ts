// language.ts
// 编程语言结构定义
// Programming language data structure
export interface ProgrammingLanguage {
    language_id: number;
    name: string;
    suffix: string;
    version: string;
    compile_command: string;
    run_command: string;
}

// 创建语言请求的数据结构
// DTO for creating a language
export interface CreateLanguageDto {
    name: string;
    suffix: string;
    version: string;
    compile_command: string;
    run_command: string;
}