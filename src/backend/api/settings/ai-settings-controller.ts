import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from "tsoa";
import { ValidateError } from "../../utils/errors/validation-error";
import {
  AiConnectionTestDto,
  AiSettingsDto,
  TestAiSettingsRequestDto,
  UpdateAiSettingsRequestDto,
} from "./ai-settings";
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

  @Response<ValidateError>(422, "Validation Failed")
  @SuccessResponse("200", "AI connection tested")
  @Post("ai/test")
  public async testAiSettings(
    @Body() body: TestAiSettingsRequestDto
  ): Promise<AiConnectionTestDto> {
    return this.service.testSettings(body);
  }
}
