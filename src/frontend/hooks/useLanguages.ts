import { useState, useEffect, useCallback } from 'react';
import useApi from './useApi';

/** 把各种后端字段名统一成前端可用格式 */
const normalise = (raw: any) => {
  const list =
    Array.isArray(raw)                 ? raw
    : Array.isArray(raw.languages)     ? raw.languages
    : Array.isArray(raw.data)          ? raw.data
    : Array.isArray(raw.data?.languages) ? raw.data.languages
    : Object.values(raw);

  return list
    .map((l: any) => {
      const rawId = l.languageId ?? l.language_id ?? l.id ?? l.languageID;
      const id    = typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;

      return {
        ...l,
        languageId: id,
        compile_command: l.compile_command ?? l.compilerCmd ?? l.compileCmd ?? null,
        run_command:     l.run_command     ?? l.runCmd      ?? l.runtimeCmd  ?? null,
      };
    })
    .filter((l: any) => Number.isFinite(l.languageId));
};

export interface Payload {
  name: string;
  runtimeCmd: string;
  compilerCmd: string | null;
  version: string | null;
  suffix: string;
}

/** 将前端 camelCase 输入转换成后端需要的 snake_case，并同时保留 camelCase 字段
 *  这样既满足 useApi 的 isNewPayload 判断，又能让后端拿到 compile_command / run_command
 */
const toBackendDto = (p: Partial<Payload>) => ({
  // 公共字段
  name: p.name,
  suffix: p.suffix,
  version: p.version ?? null,

  // camelCase (旧前端字段)
  runtimeCmd: p.runtimeCmd ?? '',
  compilerCmd: p.compilerCmd ?? null,

  // snake_case (后端校验字段)
  run_command: p.runtimeCmd ?? '',
  compile_command: p.compilerCmd ?? null,
});

export function useLanguages() {
  /** 调用通用数据层 useApi */
  const {
    getLanguages,
    addLanguage: apiAddLanguage,
    updateLanguage: apiUpdateLanguage,
    deleteLanguage: apiDeleteLanguage,
    error: apiError,
  } = useApi();

  const [languages, setLanguages] = useState<any[]>([]);

  /** 拉取并规范化语言列表 */
  const fetchLanguages = useCallback(async () => {
    const data = await getLanguages();
    setLanguages(normalise(data));
  }, [getLanguages]);

  /** 对外暴露的 CRUD，内部仍调用 useApi，并在成功后刷新本地 state */
  const addLanguage = useCallback(
    async (p: Payload) => {
      const res = await apiAddLanguage(toBackendDto(p));
      if (res) await fetchLanguages();
      return res;
    },
    [apiAddLanguage, fetchLanguages],
  );

  const updateLanguage = useCallback(
    async (id: number, p: Partial<Payload>) => {
      const res = await apiUpdateLanguage(id, toBackendDto(p));
      if (res) await fetchLanguages();
      return res;
    },
    [apiUpdateLanguage, fetchLanguages],
  );

  const deleteLanguage = useCallback(
    async (id: number) => {
      const success = await apiDeleteLanguage(id);
      if (success) await fetchLanguages();
      return success;
    },
    [apiDeleteLanguage, fetchLanguages],
  );

  /** 首次挂载自动拉取 */
  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  return {
    languages,
    error: apiError,
    fetchLanguages,
    addLanguage,
    updateLanguage,
    deleteLanguage,
  };
}