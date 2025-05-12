import { useState, useCallback } from 'react';
import axios from 'axios';

// API Response Types
interface Problem {
  problemId: number;
  title: string;
  description: string;
  difficulty: string;
  completionState?: string;
}

interface Language {
  languageId: number;
  name: string;
  compile_command?: string;
  run_command: string;
  suffix: string;
  version?: string;
}

interface TestResult {
  status: string;
  output?: string;
  runtimeMs: number;
  memoryKb: number;
}

interface RunResponse {
  status: string;
  results: TestResult[];
}

interface SubmitResponse {
  submissionId: number;
  overallStatus: string;
  results: TestResult[];
}

/** 旧前端写法：snake_case 字段 */
type OldLanguagePayload = Omit<Language, 'languageId'>;

/** 新 API 写法：camelCase 字段 */
interface NewLanguagePayload {
  name: string;
  runtimeCmd: string;
  compilerCmd?: string | null;
  version?: string | null;
  suffix: string;
}

/** 统一的输入类型：兼容旧 & 新 */
type LanguageInput = OldLanguagePayload | NewLanguagePayload;

/** 类型守卫：区分 payload 风格 */
const isNewPayload = (p: LanguageInput): p is NewLanguagePayload => 'runtimeCmd' in p;

/** 把任意输入 payload 转成后端需要的 Create/Update DTO */
const toLanguageDto = (p: LanguageInput) => {
  if (isNewPayload(p)) return p; // 已是新写法，直接返回
  // old → new 字段映射
  return {
    name:            p.name,
    runtimeCmd:      p.run_command,
    compilerCmd:     p.compile_command ?? null,
    version:         p.version ?? null,
    suffix:          p.suffix,
  };
};

// API Request Options
interface ApiOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async <T>({ url, method = 'GET', body, headers }: ApiOptions): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios({
        url,
        method,
        data: body,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
      });
      return response.data as T;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Problem related APIs
  const getProblems = useCallback(async (): Promise<Problem[]> => {
    return await fetchData<Problem[]>({ url: 'http://localhost:6785/problems' }) || [];
  }, [fetchData]);

  const getProblem = useCallback(async (id: number): Promise<Problem | null> => {
    return await fetchData<Problem>({ url: `http://localhost:6785/problems/${id}` });
  }, [fetchData]);

  // Language related APIs
  const getLanguages = useCallback(async (): Promise<Language[]> => {
    return await fetchData<Language[]>({ url: 'http://localhost:6785/languages' }) || [];
  }, [fetchData]);

  const addLanguage = useCallback(async (language: LanguageInput): Promise<Language | null> => {
    return await fetchData<Language>({
      url: 'http://localhost:6785/languages',
      method: 'POST',
      body: toLanguageDto(language),
    });
  }, [fetchData]);

  const updateLanguage = useCallback(async (id: number, language: Partial<LanguageInput>): Promise<Language | null> => {
    return await fetchData<Language>({
      url: `http://localhost:6785/languages/${id}`,
      method: 'PUT',
      body: toLanguageDto(language as LanguageInput),
    });
  }, [fetchData]);

  const deleteLanguage = useCallback(async (id: number): Promise<boolean> => {
    const result = await fetchData<{ success: boolean }>({
      url: `http://localhost:6785/languages/${id}`,
      method: 'DELETE'
    });
    return result?.success || false;
  }, [fetchData]);

  // Code submission APIs
  const runCode = useCallback(async (problemId: number, code: string, languageId: number): Promise<RunResponse | null> => {
    return await fetchData<RunResponse>({
      url: `http://localhost:6785/problems/${problemId}/run`,
      method: 'POST',
      body: { code, languageId }
    });
  }, [fetchData]);

  const submitCode = useCallback(async (problemId: number, code: string, languageId: number): Promise<SubmitResponse | null> => {
    return await fetchData<SubmitResponse>({
      url: `http://localhost:6785/problems/${problemId}/submit`,
      method: 'POST',
      body: { code, languageId }
    });
  }, [fetchData]);

  return {
    loading,
    error,
    getProblems,
    getProblem,
    getLanguages,
    addLanguage,
    updateLanguage,
    deleteLanguage,
    runCode,
    submitCode
  };
};

export default useApi;
