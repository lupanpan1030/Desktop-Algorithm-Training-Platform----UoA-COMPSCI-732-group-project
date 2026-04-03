import { AiRespondRequestDto, AiRespondResponseDto } from "./ai";
import { AiProvider } from "../../services/ai/providers/ai-provider";
import { createAiProvider } from "../../services/ai/providers/create-ai-provider";

export class AiService {
  private provider: AiProvider;

  constructor(provider: AiProvider = createAiProvider()) {
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
