import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';

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
    setLanguages(data.map(normalizeLanguage));      // 后端字段统一转换
  }, [getLanguages]);

  const addLanguage = useCallback(async (lang: LanguageInput) => {
    try {
      const res = await apiAddLanguage(lang as any); // 维持旧签名，避免类型不兼容
      if (res) setLanguages(prev => [...prev, normalizeLanguage(res)]);
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
        setLanguages(prev => prev.map(l => (l.languageId === id ? normalizeLanguage(res) : l)));
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

export { useLanguages };
export default useLanguages;