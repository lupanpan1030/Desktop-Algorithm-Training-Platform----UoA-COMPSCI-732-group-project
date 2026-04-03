import {
  Body,
  Controller,
  Post,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from "tsoa";
import { ValidateError } from "../../utils/errors/validation-error";
import { AiRespondRequestDto, AiRespondResponseDto } from "./ai";
import { AiService } from "./ai-service";

@Route("ai")
@Tags("AI")
export class AiController extends Controller {
  private service: AiService;

  constructor() {
    super();
    this.service = new AiService();
  }

  /**
   * Respond to a global assistant request using the current page context.
   */
  @Response<ValidateError>(422, "Validation Failed")
  @SuccessResponse(200, "AI response generated")
  @Post("respond")
  public async respond(
    @Body() dto: AiRespondRequestDto
  ): Promise<AiRespondResponseDto> {
    return this.service.respond(dto);
  }
}
