import { AiPageContextDto, AiRespondResponseDto, AiSuggestionDto } from "../../../api/ai/ai";
import { ProblemDetails } from "../../../api/problem/problem";
import { TestCase } from "../../../api/testcase/testcase";
import { AiTestcaseDraftDto } from "../../../api/problem-ai/problem-ai";

export type AiTestDraftGenerationStrategy =
  | "balanced"
  | "sample-first"
  | "hidden-first"
  | "edge-case-bias";

export interface AiProviderInput {
  action: "suggest" | "answer";
  userMessage?: string;
  pageContext: AiPageContextDto;
  conversation: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface AiProviderOutput extends AiRespondResponseDto {
  suggestions: AiSuggestionDto[];
}

export interface AiTestDraftInput {
  problemId: number;
  problem: ProblemDetails;
  existingTestcases: TestCase[];
  targetCount: number;
  includeSampleDrafts: boolean;
  includeHiddenDrafts: boolean;
  generationStrategy: AiTestDraftGenerationStrategy;
}

export interface AiTestDraftOutput {
  provider: string;
  drafts: AiTestcaseDraftDto[];
  warnings: string[];
}

export interface AiProvider {
  respond(input: AiProviderInput): Promise<AiProviderOutput>;
  generateTestDrafts(input: AiTestDraftInput): Promise<AiTestDraftOutput>;
}
