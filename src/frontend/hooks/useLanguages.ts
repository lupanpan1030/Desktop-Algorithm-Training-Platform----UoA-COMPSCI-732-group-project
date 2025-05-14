import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';

/**
 * useLanguages Hook
 * -----------------
 * This file centralises all logic for talking to the backend problem & language APIs
 * and adds caching plus error handling for the UI layer.
 */

/**
 * normalizeLanguage 
 * ---------------------------------
 * Converts backend camelCase or legacy snake_case fields into a unified frontend model.
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

/** Legacy front‑end payload: snake_case fields */
type OldLanguagePayload = Omit<Language, 'languageId'>;

/** New API payload in camelCase  */
interface NewLanguagePayload {
  name: string;
  runtimeCmd: string;
  compilerCmd?: string | null;
  version?: string | null;
  suffix: string;
}

/** Unified input type: compatible with both old & new  */
type LanguageInput = OldLanguagePayload | NewLanguagePayload;

/** Type guard to detect new payload style  */
const isNewPayload = (p: LanguageInput): p is NewLanguagePayload => 'runtimeCmd' in p;

/** Translate payload to backend Create/Update DTO  */
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
 * 
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
    setLanguages(data.map(normalizeLanguage));      
  }, [getLanguages]);

  const addLanguage = useCallback(async (lang: LanguageInput) => {
    try {
      const res = await apiAddLanguage(lang as any); 
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