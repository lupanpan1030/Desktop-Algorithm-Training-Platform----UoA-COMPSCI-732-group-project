export class GenerateAiTestDraftsRequestDto {
  /**
   * @minLength 2
   * @maxLength 16
   */
  public locale?: string;

  /**
   * @minimum 1
   * @maximum 8
   */
  public targetCount?: number;

  public includeSampleDrafts?: boolean;
  public includeHiddenDrafts?: boolean;
}

export class AiTestcaseDraftDto {
  public id!: string;
  public input!: string;
  public expectedOutput!: string;
  public isSample!: boolean;
  public rationale!: string;
  public confidence!: "low" | "medium" | "high";
  public riskFlags!: string[];
  public sourceHints!: string[];
}

export class GenerateAiTestDraftsResponseDto {
  public problemId!: number;
  public provider!: string;
  public drafts!: AiTestcaseDraftDto[];
  public warnings!: string[];
}
