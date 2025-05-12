import { useState, useCallback, useEffect } from 'react';
import api from '../api/axiosInstance';

/**
 * useLanguages Hook
 * -----------------
 * This file centralises all logic for talking to the backend problem & language APIs
 * and adds caching plus error handling for the UI layer.
 * 该文件封装了访问后端题库与编程语言接口的所有逻辑，并为 UI 提供缓存与错误处理。
 */

/**
 * normalizeLanguage ― 语言模型归一化
 * ---------------------------------
 * Converts backend camelCase or legacy snake_case fields into a unified frontend model.
 * 将后端返回的 camelCase 或旧版 snake_case 字段转换为前端统一使用的属性。
 */
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

// API Response Types (接口返回类型)
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

/** Legacy front‑end payload: snake_case fields (旧版前端 payload) */
type OldLanguagePayload = Omit<Language, 'languageId'>;

/** New API payload in camelCase (新版 API payload：camelCase 字段) */
interface NewLanguagePayload {
  name: string;
  runtimeCmd: string;
  compilerCmd?: string | null;
  version?: string | null;
  suffix: string;
}

/** Unified input type: compatible with both old & new (统一输入类型：兼容旧版与新版) */
type LanguageInput = OldLanguagePayload | NewLanguagePayload;

/** Type guard to detect new payload style (类型守卫：判断 payload 是否为新版格式) */
const isNewPayload = (p: LanguageInput): p is NewLanguagePayload => 'runtimeCmd' in p;

/** Translate payload to backend Create/Update DTO (将任意输入 payload 转换为后端需要的 Create/Update DTO) */
const toLanguageDto = (lang: LanguageInput) => ({
  name:        lang.name,
  suffix:      lang.suffix,
  version:     lang.version,
  compilerCmd: lang.compilerCmd ?? null,
  runtimeCmd:  lang.runtimeCmd,
});

// Generic API request options (通用 API 请求选项)
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

  // Problem related APIs (题目相关接口)
  const getProblems = useCallback(async (): Promise<Problem[]> => {
    return await fetchData<Problem[]>({ url: 'http://localhost:6785/problems' }) || [];
  }, [fetchData]);

  const getProblem = useCallback(async (id: number): Promise<Problem | null> => {
    return await fetchData<Problem>({ url: `http://localhost:6785/problems/${id}` });
  }, [fetchData]);

  // Language related APIs (编程语言相关接口)
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
    // Most back‑ends return HTTP 204 (No Content) with an empty body on successful DELETE.
    // 多数后端在成功删除时返回 HTTP 204（No Content）且无响应体。
    // Therefore, treat any 2xx response that does not throw as failure unless the server explicitly indicates it.
    // 因此只要请求未抛错，即视作成功，除非服务器显式声明失败。
    const result = await fetchData<{ success?: boolean }>({
      url: `http://localhost:6785/languages/${id}`,
      method: 'DELETE',
    });

    // If the server returns { success:false } we treat it as failure; otherwise we assume success.
    // 若服务器返回 { success:false } 则视为失败；否则默认成功。
    return result?.success !== false;
  }, [fetchData]);

  // Code submission APIs (代码运行与提交接口)
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

/**
 * useLanguages
 * ------------
 * Thin wrapper around useApi that caches the language list locally so that the UI can
 * update optimistically and roll back if a request fails.
 * 该 Hook 通过 useApi 执行网络请求，并在本地缓存语言列表，以便 UI 即时响应。
 */
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