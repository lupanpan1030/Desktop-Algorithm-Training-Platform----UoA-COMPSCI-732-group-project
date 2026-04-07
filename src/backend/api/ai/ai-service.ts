import { AiRespondRequestDto, AiRespondResponseDto } from "./ai";
import { AiProvider } from "../../services/ai/providers/ai-provider";
import { createAiProvider } from "../../services/ai/providers/create-ai-provider";
import {
  buildDefaultSources,
  buildDefaultSuggestions,
} from "../../services/ai/providers/provider-utils";

export class AiService {
  private readonly providerSource: AiProvider | (() => Promise<AiProvider>);

  constructor(provider: AiProvider | (() => Promise<AiProvider>) = createAiProvider) {
    this.providerSource = provider;
  }

  private async getProvider() {
    if (typeof this.providerSource === "function") {
      return this.providerSource();
    }

    return this.providerSource;
  }

  async respond(dto: AiRespondRequestDto): Promise<AiRespondResponseDto> {
    if ((dto.action ?? "suggest") === "suggest" && !dto.userMessage) {
      return {
        answer: `I am ready to help with "${dto.pageContext.pageTitle}". ${dto.pageContext.summary}`,
        suggestions: buildDefaultSuggestions(dto.pageContext),
        inferredIntent:
          dto.pageContext.pageKind === "problem-detail"
            ? "explain_problem"
            : dto.pageContext.pageKind === "problem-admin"
              ? "curation_help"
              : dto.pageContext.pageKind === "language-admin"
                ? "language_help"
                : "page_help",
        sourcesUsed: buildDefaultSources(dto.pageContext),
        provider: "context-only",
      };
    }

    const provider = await this.getProvider();

    return provider.respond({
      action: dto.action ?? (dto.userMessage ? "answer" : "suggest"),
      userMessage: dto.userMessage,
      pageContext: dto.pageContext,
      conversation:
        dto.conversation?.map((turn) => ({
          role: turn.role,
          content: turn.content,
        })) ?? [],
    });
  }
}
