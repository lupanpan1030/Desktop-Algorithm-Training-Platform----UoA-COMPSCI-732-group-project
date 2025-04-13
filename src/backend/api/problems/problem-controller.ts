// This file defines the ProblemsController class, which handles HTTP requests related to problems.
// It uses TSOA to define the routes and their corresponding methods.

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Route,
  Body,
  Path,
  Response,
  SuccessResponse,
  Tags,
} from "tsoa";
import {
  ProblemSummary,
  ProblemDetails,
  CreateProblemParams,
  UpdateProblemParams,
} from "./problem";
import { ProblemsService } from "./problem-service";
import { ValidateError } from "../../utils/errors/validation-error";
import { NotFoundError } from "../../utils/errors/not-found-error";

@Route("problems")
@Tags("Problems")
export class ProblemsController extends Controller {
  private problemsService = new ProblemsService();

  /**
   * Retrieves a list of all problems with summary information.
   */
  @SuccessResponse("200", "OK")
  @Get()
  public async getAllProblems(): Promise<ProblemSummary[]> {
    return this.problemsService.getAllProblems();
  }

  /**
   * Retrieves the detailed information of a specific problem by its ID.
   * @param problemId The ID of the problem.
   */
  @Response<NotFoundError>(404, "Problem not found")
  @SuccessResponse("200", "OK")
  @Get("{problemId}")
  public async getProblem(@Path() problemId: number): Promise<ProblemDetails> {
    return this.problemsService.getProblem(problemId);
  }

  /**
   * Creates a new problem.
   * @param requestBody The data required to create the problem.
   */
  @Response<ValidateError>(422, "Validation Failed")
  @SuccessResponse("201", "Created")
  @Post()
  public async createProblem(
    @Body() requestBody: CreateProblemParams
  ): Promise<ProblemDetails> {
    this.setStatus(201);
    return this.problemsService.createProblem(requestBody);
  }

  /**
   * Updates an existing problem.
   * @param problemId The ID of the problem to update.
   * @param requestBody The updated problem data.
   */
  @Response<NotFoundError>(404, "Problem not found")
  @Response<ValidateError>(422, "Validation Failed")
  @Put("{problemId}")
  public async updateProblem(
    @Path() problemId: number,
    @Body() requestBody: UpdateProblemParams
  ): Promise<ProblemDetails> {
    return this.problemsService.updateProblem(problemId, requestBody);
  }

  /**
   * Deletes a problem by its ID.
   * @param problemId The ID of the problem to delete.
   */
  @SuccessResponse("204", "No Content")
  @Delete("{problemId}")
  public async deleteProblem(@Path() problemId: number): Promise<void> {
    await this.problemsService.deleteProblem(problemId);
    this.setStatus(204);
  }
}