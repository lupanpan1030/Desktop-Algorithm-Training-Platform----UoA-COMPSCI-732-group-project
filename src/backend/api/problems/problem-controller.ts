// problem-controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Route,
  Body,
  Path,
  SuccessResponse,
} from "tsoa";
import {
  ProblemsService,
  ProblemSummary,
  ProblemDetails,
} from "./problem";

@Route("problems")
export class ProblemsController extends Controller {
  private problemsService = new ProblemsService();

  /**
   * Retrieves a list of all problems with summary information.
   */
  @Get()
  public async getAllProblems(): Promise<ProblemSummary[]> {
    return this.problemsService.getAllProblems();
  }

  /**
   * Retrieves the detailed information of a specific problem by its ID.
   * @param problemId The ID of the problem.
   */
  @Get("{problemId}")
  public async getProblem(@Path() problemId: number): Promise<ProblemDetails> {
    return this.problemsService.getProblem(problemId);
  }
}
