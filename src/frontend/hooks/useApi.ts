import { useState, useCallback } from 'react';
import api from '../api/axiosInstance';

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
  compilerCmd?: string | null;
  runtimeCmd: string;
  compile_command?: string | null;
  run_command?: string;
  suffix: string;
  version?: string | null;
  isDefault?: boolean;
}

export interface TestResult {
  status: string;
  output?: string;
  expectedOutput?: string;
  runtimeMs: number;
  memoryKb: number;
}

export interface RunResponse {
  status: string;
  results: TestResult[];
}

export interface SubmitResponse {
  submissionId: number;
  overallStatus: string;
  results: TestResult[];
}

export interface SubmissionListItem {
  submissionId: number;
  languageId: number;
  status: string;
  submittedAt: string;
}

export interface SubmissionDetail extends SubmissionListItem {
  code: string;
  results: TestResult[];
}

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

  const request = useCallback(async <T>({ url, method = 'GET', body, headers }: ApiOptions): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api({
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
      const normalizedError = err instanceof Error ? err : new Error('Request failed');
      setError(normalizedError);
      throw normalizedError;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProblems = useCallback(async (): Promise<Problem[]> => {
    try {
      return await request<Problem[]>({ url: '/problems' });
    } catch {
      return [];
    }
  }, [request]);

  const getProblem = useCallback(async (id: number): Promise<Problem | null> => {
    try {
      return await request<Problem>({ url: `/problems/${id}` });
    } catch {
      return null;
    }
  }, [request]);

  const getLanguages = useCallback(async (): Promise<Language[]> => {
    try {
      return await request<Language[]>({ url: '/languages' });
    } catch {
      return [];
    }
  }, [request]);

  const addLanguage = useCallback(async (language: Omit<Language, 'languageId'>): Promise<Language | null> => {
    return await request<Language>({
      url: '/languages',
      method: 'POST',
      body: language
    });
  }, [request]);

  const updateLanguage = useCallback(async (id: number, language: Partial<Language>): Promise<Language | null> => {
    return await request<Language>({
      url: `/languages/${id}`,
      method: 'PUT',
      body: language
    });
  }, [request]);

  const deleteLanguage = useCallback(async (id: number): Promise<boolean> => {
    await request<void>({
      url: `/languages/${id}`,
      method: 'DELETE'
    });
    return true;
  }, [request]);

  const runCode = useCallback(async (problemId: number, code: string, languageId: number): Promise<RunResponse | null> => {
    return await request<RunResponse>({
      url: `/problems/${problemId}/run`,
      method: 'POST',
      body: { code, languageId }
    });
  }, [request]);

  const submitCode = useCallback(async (problemId: number, code: string, languageId: number): Promise<SubmitResponse | null> => {
    return await request<SubmitResponse>({
      url: `/problems/${problemId}/submit`,
      method: 'POST',
      body: { code, languageId }
    });
  }, [request]);

  const getSubmissions = useCallback(async (problemId: number): Promise<SubmissionListItem[]> => {
    try {
      return await request<SubmissionListItem[]>({
        url: `/problems/${problemId}/submissions`
      });
    } catch {
      return [];
    }
  }, [request]);

  const getSubmission = useCallback(async (problemId: number, submissionId: number): Promise<SubmissionDetail | null> => {
    try {
      return await request<SubmissionDetail>({
        url: `/problems/${problemId}/submissions/${submissionId}`
      });
    } catch {
      return null;
    }
  }, [request]);

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
    submitCode,
    getSubmissions,
    getSubmission
  };
};

export default useApi;
