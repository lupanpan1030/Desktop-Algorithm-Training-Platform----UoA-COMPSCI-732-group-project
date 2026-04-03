import { AiRespondRequestDto, AiRespondResponseDto } from "./ai";
import { AiProvider } from "../../services/ai/providers/ai-provider";
import { MockAiProvider } from "../../services/ai/providers/mock-ai-provider";

export class AiService {
  private provider: AiProvider;

  constructor(provider: AiProvider = new MockAiProvider()) {
    this.provider = provider;
  }

  async respond(dto: AiRespondRequestDto): Promise<AiRespondResponseDto> {
    return this.provider.respond({
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
