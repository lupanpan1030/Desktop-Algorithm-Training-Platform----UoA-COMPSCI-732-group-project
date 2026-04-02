import { useState, useCallback } from 'react';
import api from '../api/axiosInstance';

// API Response Types
export interface ProblemSummary {
  problemId: number;
  title: string;
  difficulty: string;
  completionState?: string;
  source: string;
  locale: string;
  sourceSlug?: string | null;
  externalProblemId?: string | null;
  judgeReady: boolean;
  testcaseCount: number;
}

export interface ProblemDetails extends ProblemSummary {
  description: string;
  createdAt: string;
  sampleTestcase?: string | null;
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

export interface TestCase {
  testcaseId: number;
  input: string;
  expectedOutput: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  isSample: boolean;
}

export interface ProblemMutationPayload {
  title: string;
  description: string;
  difficulty: string;
}

export interface TestCaseMutationPayload {
  input: string;
  expectedOutput: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  isSample?: boolean;
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

  const getProblems = useCallback(async (): Promise<ProblemSummary[]> => {
    try {
      return await request<ProblemSummary[]>({ url: '/problems' });
    } catch {
      return [];
    }
  }, [request]);

  const getProblem = useCallback(async (id: number): Promise<ProblemDetails | null> => {
    try {
      return await request<ProblemDetails>({ url: `/problems/${id}` });
    } catch {
      return null;
    }
  }, [request]);

  const addProblem = useCallback(async (problem: ProblemMutationPayload): Promise<ProblemDetails | null> => {
    return await request<ProblemDetails>({
      url: '/problems',
      method: 'POST',
      body: problem,
    });
  }, [request]);

  const updateProblem = useCallback(async (id: number, problem: Partial<ProblemMutationPayload>): Promise<ProblemDetails | null> => {
    return await request<ProblemDetails>({
      url: `/problems/${id}`,
      method: 'PUT',
      body: problem,
    });
  }, [request]);

  const deleteProblem = useCallback(async (id: number): Promise<boolean> => {
    await request<void>({
      url: `/problems/${id}`,
      method: 'DELETE',
    });
    return true;
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

  const getTestCases = useCallback(async (problemId: number): Promise<TestCase[]> => {
    try {
      return await request<TestCase[]>({
        url: `/problems/${problemId}/testcases`,
      });
    } catch {
      return [];
    }
  }, [request]);

  const addTestCase = useCallback(async (
    problemId: number,
    testcase: TestCaseMutationPayload
  ): Promise<TestCase | null> => {
    return await request<TestCase>({
      url: `/problems/${problemId}/testcases`,
      method: 'POST',
      body: testcase,
    });
  }, [request]);

  const updateTestCase = useCallback(async (
    problemId: number,
    testcaseId: number,
    testcase: Partial<TestCaseMutationPayload>
  ): Promise<TestCase | null> => {
    return await request<TestCase>({
      url: `/problems/${problemId}/testcases/${testcaseId}`,
      method: 'PUT',
      body: testcase,
    });
  }, [request]);

  const deleteTestCase = useCallback(async (
    problemId: number,
    testcaseId: number
  ): Promise<boolean> => {
    await request<void>({
      url: `/problems/${problemId}/testcases/${testcaseId}`,
      method: 'DELETE',
    });
    return true;
  }, [request]);

  return {
    loading,
    error,
    getProblems,
    getProblem,
    addProblem,
    updateProblem,
    deleteProblem,
    getLanguages,
    addLanguage,
    updateLanguage,
    deleteLanguage,
    runCode,
    submitCode,
    getSubmissions,
    getSubmission,
    getTestCases,
    addTestCase,
    updateTestCase,
    deleteTestCase
  };
};

export default useApi;
