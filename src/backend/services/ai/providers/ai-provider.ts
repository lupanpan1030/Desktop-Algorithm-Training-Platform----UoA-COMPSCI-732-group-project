import { AiPageContextDto, AiRespondResponseDto, AiSuggestionDto } from "../../../api/ai/ai";

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

export interface AiProvider {
  respond(input: AiProviderInput): Promise<AiProviderOutput>;
}
