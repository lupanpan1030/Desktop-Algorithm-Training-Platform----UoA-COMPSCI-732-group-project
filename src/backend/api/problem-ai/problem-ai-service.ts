import { ProblemsService } from "../problem/problem-service";
import { TestCaseService } from "../testcase/testcase-service";
import {
  GenerateAiTestDraftsRequestDto,
  GenerateAiTestDraftsResponseDto,
} from "./problem-ai";
import { createAiProvider } from "../../services/ai/providers/create-ai-provider";
import { AiProvider } from "../../services/ai/providers/ai-provider";

function clampTargetCount(value?: number) {
  if (!Number.isFinite(value)) {
    return 5;
  }

  return Math.max(1, Math.min(8, Math.trunc(value ?? 5)));
}

export class ProblemAiService {
  constructor(
    private readonly problemsService: ProblemsService = new ProblemsService(),
    private readonly testCaseService: TestCaseService = new TestCaseService(),
    private readonly provider: AiProvider = createAiProvider()
  ) {}

  public async generateTestDrafts(
    problemId: number,
    dto: GenerateAiTestDraftsRequestDto
  ): Promise<GenerateAiTestDraftsResponseDto> {
    const includeSampleDrafts = dto.includeSampleDrafts ?? true;
    const includeHiddenDrafts = dto.includeHiddenDrafts ?? true;

    const problem = await this.problemsService.getProblem(
      problemId,
      dto.locale,
      Boolean(dto.locale)
    );
    const existingTestcases = await this.testCaseService.getTestCases(problemId);

    const result = await this.provider.generateTestDrafts({
      problemId,
      problem,
      existingTestcases,
      targetCount: clampTargetCount(dto.targetCount),
      includeSampleDrafts,
      includeHiddenDrafts,
    });

    return {
      problemId,
      provider: result.provider,
      drafts: result.drafts,
      warnings: result.warnings,
    };
  }
}
