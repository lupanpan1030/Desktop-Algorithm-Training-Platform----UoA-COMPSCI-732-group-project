import { useState, useCallback, useRef } from 'react';
import api, { type ApiClientError } from '../api/axiosInstance';

// API Response Types
export interface ProblemSummary {
  problemId: number;
  title: string;
  difficulty: string;
  completionState?: string;
  source: string;
  locale: string;
  defaultLocale: string;
  availableLocales: string[];
  sourceSlug?: string | null;
  externalProblemId?: string | null;
  judgeReady: boolean;
  testcaseCount: number;
  sampleCaseCount: number;
  hiddenCaseCount: number;
  sampleReferenceAvailable: boolean;
  tags: string[];
}

export interface StarterCodeSnippet {
  languageSlug: string;
  languageName: string;
  template: string;
}

export interface ProblemDetails extends ProblemSummary {
  description: string;
  createdAt: string;
  sampleTestcase?: string | null;
  starterCodes: StarterCodeSnippet[];
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
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  phase?: string;
  timedOut?: boolean;
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
  locale?: string;
}

export interface TestCaseMutationPayload {
  input: string;
  expectedOutput: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  isSample?: boolean;
}

export interface AiSettings {
  provider: "mock" | "openai";
  model: string;
  baseUrl: string;
  timeoutMs: number;
  apiKeyConfigured: boolean;
  apiKeySource: "saved" | "environment" | "none";
  apiKeyPreview: string | null;
  status: "preview" | "ready" | "misconfigured";
  statusLabel: string;
  statusReason: string;
  storagePath: string;
  storageScope: string;
}

export interface AiSettingsUpdatePayload {
  provider: "mock" | "openai";
  model: string;
  baseUrl: string;
  timeoutMs: number;
  apiKey?: string;
  clearApiKey?: boolean;
}

export interface AiTestcaseDraft {
  id: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  rationale: string;
  confidence: "low" | "medium" | "high";
  riskFlags: string[];
  sourceHints: string[];
}

export type AiDraftGenerationStrategy =
  | "balanced"
  | "sample-first"
  | "hidden-first"
  | "edge-case-bias";

export interface GenerateAiTestDraftsPayload {
  locale?: string;
  targetCount?: number;
  includeSampleDrafts?: boolean;
  includeHiddenDrafts?: boolean;
  generationStrategy?: AiDraftGenerationStrategy;
}

export interface GenerateAiTestDraftsResponse {
  problemId: number;
  provider: string;
  drafts: AiTestcaseDraft[];
  warnings: string[];
}

// API Request Options
interface ApiOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
}

const RETRYABLE_GET_DELAYS_MS = [250, 750];

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function shouldRetryRequest(method: ApiOptions["method"], error: ApiClientError) {
  if (method !== "GET") {
    return false;
  }

  return Boolean(
    error.isNetworkError ||
      error.code === "ECONNABORTED" ||
      error.code === "ECONNREFUSED" ||
      error.code === "ECONNRESET"
  );
}

function logFinalApiFailure(error: ApiClientError, method: string, url: string) {
  const methodLabel = error.method ?? method;
  const requestUrl = error.requestUrl ?? url;
  const logger =
    error.isNetworkError && typeof process !== "undefined" && process.env?.NODE_ENV === "development"
      ? console.warn
      : console.error;

  logger(`[api:error] ${methodLabel} ${requestUrl} -> ${error.message}`);
}

export const useApi = () => {
  const [activeRequestCount, setActiveRequestCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const loading = activeRequestCount > 0;
  const latestRequestIdRef = useRef(0);

  const request = useCallback(async <T>({ url, method = 'GET', body, headers, params }: ApiOptions): Promise<T> => {
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;
    setActiveRequestCount((count) => count + 1);
    setError(null);
    
    try {
      for (let attempt = 0; attempt <= RETRYABLE_GET_DELAYS_MS.length; attempt += 1) {
        try {
          const response = await api({
            url,
            method,
            data: body,
            params,
            headers: {
              'Content-Type': 'application/json',
              ...headers
            },
          });
          if (latestRequestIdRef.current === requestId) {
            setError(null);
          }
          return response.data as T;
        } catch (err) {
          const normalizedError = err instanceof Error
            ? err as ApiClientError
            : new Error('Request failed');

          const requestIsStale = latestRequestIdRef.current !== requestId;
          const canRetry =
            !requestIsStale &&
            shouldRetryRequest(method, normalizedError) &&
            attempt < RETRYABLE_GET_DELAYS_MS.length;

          if (canRetry) {
            await delay(RETRYABLE_GET_DELAYS_MS[attempt]);
            continue;
          }

          if (!requestIsStale) {
            setError(normalizedError);
            logFinalApiFailure(normalizedError, method, url);
          }

          throw normalizedError;
        }
      }

      throw new Error('Request failed');
    } finally {
      setActiveRequestCount((count) => Math.max(0, count - 1));
    }
  }, []);

  const getProblems = useCallback(async (
    locale?: string,
    strictLocale = false
  ): Promise<ProblemSummary[]> => {
    return await request<ProblemSummary[]>({
      url: '/problems',
      params: {
        locale,
        strictLocale,
      },
    });
  }, [request]);

  const getProblem = useCallback(async (
    id: number,
    locale?: string,
    strictLocale = false
  ): Promise<ProblemDetails | null> => {
    return await request<ProblemDetails>({
      url: `/problems/${id}`,
      params: {
        locale,
        strictLocale,
      },
    });
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

  const getLanguages = useCallback(async (): Promise<Language[] | null> => {
    return await request<Language[]>({ url: '/languages' });
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
    return await request<SubmissionListItem[]>({
      url: `/problems/${problemId}/submissions`
    });
  }, [request]);

  const getSubmission = useCallback(async (problemId: number, submissionId: number): Promise<SubmissionDetail | null> => {
    return await request<SubmissionDetail>({
      url: `/problems/${problemId}/submissions/${submissionId}`
    });
  }, [request]);

  const getTestCases = useCallback(async (problemId: number): Promise<TestCase[]> => {
    return await request<TestCase[]>({
      url: `/problems/${problemId}/testcases`,
    });
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

  const getAiSettings = useCallback(async (): Promise<AiSettings> => {
    return await request<AiSettings>({
      url: "/settings/ai",
    });
  }, [request]);

  const updateAiSettings = useCallback(async (
    settings: AiSettingsUpdatePayload
  ): Promise<AiSettings> => {
    return await request<AiSettings>({
      url: "/settings/ai",
      method: "PUT",
      body: settings,
    });
  }, [request]);

  const generateAiTestDrafts = useCallback(async (
    problemId: number,
    payload: GenerateAiTestDraftsPayload
  ): Promise<GenerateAiTestDraftsResponse> => {
    return await request<GenerateAiTestDraftsResponse>({
      url: `/problems/${problemId}/ai/test-drafts`,
      method: "POST",
      body: payload,
    });
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
    deleteTestCase,
    getAiSettings,
    updateAiSettings,
    generateAiTestDrafts,
  };
};

export default useApi;
