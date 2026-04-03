export class AiContextFactDto {
  public key!: string;
  public label!: string;
  public value!: string;
}

export class AiConversationTurnDto {
  /**
   * @isString
   */
  public role!: "user" | "assistant";

  /**
   * @minLength 1
   */
  public content!: string;
}

export class AiPageContextDto {
  /**
   * @minLength 1
   */
  public pageKind!: string;

  /**
   * @minLength 1
   */
  public route!: string;

  /**
   * @minLength 1
   */
  public pageTitle!: string;

  /**
   * @minLength 1
   */
  public summary!: string;

  public locale?: string;
  public facts?: AiContextFactDto[];
  public contextText?: string[];
  public suggestedPrompts?: string[];
}

export class AiRespondRequestDto {
  public action?: "suggest" | "answer";
  public userMessage?: string;
  public pageContext!: AiPageContextDto;
  public conversation?: AiConversationTurnDto[];
}

export interface AiSuggestionDto {
  id: string;
  label: string;
  prompt: string;
}

export interface AiRespondResponseDto {
  answer: string;
  suggestions: AiSuggestionDto[];
  inferredIntent: string;
  sourcesUsed: string[];
  provider: string;
}
