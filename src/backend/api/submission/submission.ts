// DTOs for request bodies
export interface RunCodeDto {
  code: string;
  languageId: number;
}

export interface SubmitCodeDto {
  code: string;
  languageId: number;
}

// DTOs for response bodies
export interface SubmissionResultDto {
  status: string;
  output?: string;
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
  code: string;
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
