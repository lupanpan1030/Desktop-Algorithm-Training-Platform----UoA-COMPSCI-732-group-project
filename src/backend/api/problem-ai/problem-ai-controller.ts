import {
  Body,
  Controller,
  Path,
  Post,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from "tsoa";
import { ValidateError } from "../../utils/errors/validation-error";
import { NotFoundError } from "../../utils/errors/not-found-error";
import {
  GenerateAiTestDraftsRequestDto,
  GenerateAiTestDraftsResponseDto,
} from "./problem-ai";
import { ProblemAiService } from "./problem-ai-service";

@Route("problems/{problemId}/ai")
@Tags("Problem AI")
export class ProblemAiController extends Controller {
  private readonly service = new ProblemAiService();

  /**
   * Generate reviewable AI testcase drafts for a curated problem.
   */
  @Response<ValidateError>(422, "Validation Failed")
  @Response<NotFoundError>(404, "Problem not found")
  @SuccessResponse(200, "AI testcase drafts generated")
  @Post("test-drafts")
  public async generateTestDrafts(
    @Path() problemId: number,
    @Body() dto: GenerateAiTestDraftsRequestDto
  ): Promise<GenerateAiTestDraftsResponseDto> {
    return this.service.generateTestDrafts(problemId, dto);
  }
}
