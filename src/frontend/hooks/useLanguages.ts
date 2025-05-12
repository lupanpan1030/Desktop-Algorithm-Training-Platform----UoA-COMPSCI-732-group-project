import { useState, useCallback, useEffect } from 'react';
import api from '../api/axiosInstance';

/** ------------------------------------------------------------
 * Helper: convert back‑end DTO (camelCase) → UI model (snake_case)
 * Accepts either legacy snake_case or new camelCase payloads.
 * -----------------------------------------------------------*/
const normalizeLanguage = (l: any) => ({
  id:         l.languageId ?? l.language_id,
  languageId:  l.languageId ?? l.language_id,
  name:        l.name,
  compilerCmd: l.compilerCmd ?? l.compile_command ?? null,
  runtimeCmd:  l.runtimeCmd  ?? l.run_command    ?? '',
  suffix:      l.suffix,
  version:     l.version ?? null,
  isDefault:   l.isDefault ?? l.is_default ?? false,
});

// API Response Types
interface Problem {
  problemId: number;
  title: string;
  description: string;
  difficulty: string;
  completionState?: string;
}

export interface Language {
  id?: number;
  languageId: number;
  name: string;
  compilerCmd?: string;
  runtimeCmd: string;
  suffix: string;
  version?: string;
  /** true → built‑in language that cannot be deleted */
  isDefault?: boolean;
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
const toLanguageDto = (lang: LanguageInput) => ({
  name:        lang.name,
  suffix:      lang.suffix,
  version:     lang.version,
  compilerCmd: lang.compilerCmd ?? null,
  runtimeCmd:  lang.runtimeCmd,
});

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
      const response = await api.request({
        url,
        method,
        data: body,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
      });
      return response.data as T;
    } catch (err: any) {
      // 把后端返回的 message 透传；没有就用原生 message
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Unknown error';
      setError(new Error(msg));
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
    const raw = await fetchData<any[]>({ url: 'http://localhost:6785/languages' }) || [];
    return raw.map(normalizeLanguage);
  }, [fetchData]);

  const addLanguage = useCallback(async (language: LanguageInput): Promise<Language | null> => {
    const raw = await fetchData<any>({
      url: 'http://localhost:6785/languages',
      method: 'POST',
      body: toLanguageDto(language),
    });
    return raw ? normalizeLanguage(raw) : null;
  }, [fetchData]);

  const updateLanguage = useCallback(async (id: number, language: Partial<LanguageInput>): Promise<Language | null> => {
    const raw = await fetchData<any>({
      url: `http://localhost:6785/languages/${id}`,
      method: 'PUT',
      body: toLanguageDto(language as LanguageInput),
    });
    return raw ? normalizeLanguage(raw) : null;
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

/** ------------------------------------------------------------------
 * Thin wrapper hook that exposes a cached languages list and helpers.
 * Delegates network calls to useApi but keeps local state so the UI
 * can rely on `languages` and `fetchLanguages` consistently.
 * ------------------------------------------------------------------*/
const useLanguages = () => {
  const {
    loading,
    error,
    getLanguages,
    addLanguage: apiAddLanguage,
    updateLanguage: apiUpdateLanguage,
    deleteLanguage: apiDeleteLanguage,
  } = useApi();

  const [languages, setLanguages] = useState<Language[]>([]);

  const fetchLanguages = useCallback(async () => {
    const data = await getLanguages();
    setLanguages(data);
  }, [getLanguages]);

  const addLanguage = useCallback(async (lang: LanguageInput) => {
    try {
      const res = await apiAddLanguage(lang);
      if (res) setLanguages(prev => [...prev, res]);  // optimistic
      return res;
    } catch (e) {
      await fetchLanguages();                        // rollback
      throw e;
    }
  }, [apiAddLanguage, fetchLanguages]);

  const updateLanguage = useCallback(async (id: number, lang: Partial<LanguageInput>) => {
    try {
      const res = await apiUpdateLanguage(id, lang);
      if (res) {
        setLanguages(prev => prev.map(l => (l.languageId === id ? res : l)));
      }
      return res;
    } catch (e) {
      await fetchLanguages();
      throw e;
    }
  }, [apiUpdateLanguage, fetchLanguages]);

  const deleteLanguage = useCallback(async (id: number) => {
    try {
      const ok = await apiDeleteLanguage(id);
      if (ok) {
        setLanguages(prev => prev.filter(l => l.languageId !== id));
      }
      return ok;
    } catch (e) {
      await fetchLanguages();
      throw e;
    }
  }, [apiDeleteLanguage, fetchLanguages]);

  // Auto‑load languages once on mount
  useEffect(() => {
    fetchLanguages();
  }, []); // run once on mount

  return {
    loading,
    error,
    languages,
    fetchLanguages,
    addLanguage,
    updateLanguage,
    deleteLanguage,
  };
};

export default useApi;

export { useLanguages };