// This file defines the TestCaseController class, which handles HTTP requests related to test cases.
// It uses TSOA to define the routes and their corresponding methods.

import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Response,
  SuccessResponse,
  Route,
  Tags,
  Middlewares,
} from "tsoa";
import { TestCase, CreateTestCaseParams } from "./testcase";
import { TestCaseService } from "./testcase-service";
import { validateProblemId } from "../../utils/validate-problem-id";
import { ValidateError } from "../../utils/errors/validation-error";
import { NotFoundError } from "../../utils/errors/not-found-error";

@Route("problems/{problemId}/testcases")
@Middlewares(validateProblemId)
@Tags("TestCases")
export class TestCaseController extends Controller {
  private testCaseService = new TestCaseService();
  /**
   * Retrieves all test cases for a given problem.
   * @param problemId The ID of the problem.
   */
  @Response<NotFoundError>(404, "Problem not found")
  @SuccessResponse("200", "OK")
  @Get()
  public async getTestCases(@Path() problemId: number): Promise<TestCase[]> {
    return this.testCaseService.getTestCases(problemId);
  }

  /**
   * Creates a new test case for a given problem.
   * @param problemId The ID of the problem.
   * @param requestBody The test case data.
   */
  @Response<NotFoundError>(404, "Problem not found")
  @Response<ValidateError>(422, "Validation Failed")
  @SuccessResponse("201", "Created")
  @Post()
  public async createTestCase(
    @Path() problemId: number,
    @Body() requestBody: CreateTestCaseParams
  ): Promise<TestCase> {
    this.setStatus(201);
    return this.testCaseService.createTestCase(problemId, requestBody);
  }

  /**
   * Deletes a test case for a given problem.
   * @param problemId The ID of the problem.
   * @param testcaseId The ID of the test case to delete.
   */
  @Response<NotFoundError>(404, "Problem not found")
  @SuccessResponse("204", "No Content")
  @Delete("{testcaseId}")
  public async deleteTestCase(
    @Path() problemId: number,
    @Path() testcaseId: number
  ): Promise<void> {
    await this.testCaseService.deleteTestCase(problemId, testcaseId);
    this.setStatus(204);
  }
}
