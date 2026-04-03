// DTOs for request bodies
export class RunCodeDto {
  /**
   * @minLength 1
   */
  public code!: string;
  public languageId!: number;
}

export class SubmitCodeDto {
  /**
   * @minLength 1
   */
  public code!: string;
  public languageId!: number;
}

// DTOs for response bodies
export interface SubmissionResultDto {
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

export interface RunCodeResponseDto {
  status: string;
  results: SubmissionResultDto[];
}

export interface SubmitCodeResponseDto {
    submissionId: number;
    overallStatus: string;
    results: SubmissionResultDto[];
  }

export interface SubmissionListItemDto {
  submissionId: number;
  languageId: number;
  status: string;
  submittedAt: string; // ISO8601 format
}

export interface SubmissionDetailDto {
  submissionId: number;
  code: string;
  languageId: number;
  status: string;
  submittedAt: string; // ISO8601 format
  results: SubmissionResultDto[];
}
