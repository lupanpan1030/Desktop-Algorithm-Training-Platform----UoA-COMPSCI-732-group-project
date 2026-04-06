import {
  Body,
  Controller,
  Get,
  Put,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from "tsoa";
import { ValidateError } from "../../utils/errors/validation-error";
import { AiSettingsDto, UpdateAiSettingsRequestDto } from "./ai-settings";
import { AiSettingsService } from "./ai-settings-service";

@Route("settings")
@Tags("Settings")
export class AiSettingsController extends Controller {
  private service = new AiSettingsService();

  @SuccessResponse("200", "AI settings loaded")
  @Get("ai")
  public async getAiSettings(): Promise<AiSettingsDto> {
    return this.service.getSettings();
  }

  @Response<ValidateError>(422, "Validation Failed")
  @SuccessResponse("200", "AI settings updated")
  @Put("ai")
  public async updateAiSettings(
    @Body() body: UpdateAiSettingsRequestDto
  ): Promise<AiSettingsDto> {
    return this.service.updateSettings(body);
  }
}
