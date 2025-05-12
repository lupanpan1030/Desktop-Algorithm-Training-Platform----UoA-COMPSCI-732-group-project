import { useState, useEffect, useCallback } from 'react';

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

export function useLanguages() {
  const [languages, setLanguages] = useState<any[]>([]);
  const [error, setError]         = useState<string | null>(null);

  const fetchLanguages = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:6785/languages');
      const raw = await res.json();
      setLanguages(normalise(raw));
      setError(null);
    } catch (e) {
      console.error(e);
      setError('Network error');
      setLanguages([]);
    }
  }, []);

  const request = async (url: string, method: string, body?: any) => {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(await res.text());
    await fetchLanguages();
  };

  const addLanguage    = (p: Payload)             => request('http://localhost:6785/languages', 'POST', p);
  const updateLanguage = (id: number, p: Payload) => request(`http://localhost:6785/languages/${id}`, 'PUT', p);
  const deleteLanguage = (id: number)             => request(`http://localhost:6785/languages/${id}`, 'DELETE');

  useEffect(() => { fetchLanguages(); }, [fetchLanguages]);

  return { languages, error, fetchLanguages, addLanguage, updateLanguage, deleteLanguage };
}