// This file defines the TestCaseController class, which handles HTTP requests related to test cases.
// It uses TSOA to define the routes and their corresponding methods.

import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Response,
  SuccessResponse,
  Route,
  Tags,
  Middlewares,
} from "tsoa";
import { TestCase, CreateTestCaseParams, UpdateTestCaseParams } from "./testcase";
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
   * Updates a test case for a given problem.
   * @param problemId The ID of the problem.
   * @param testcaseId The ID of the test case to update.
   * @param requestBody The test case data to update.
   */
  @Response<NotFoundError>(404, "Problem or test case not found")
  @Response<ValidateError>(422, "Validation Failed")
  @SuccessResponse("200", "OK")
  @Put("{testcaseId}")
  public async updateTestCase(
    @Path() problemId: number,
    @Path() testcaseId: number,
    @Body() requestBody: UpdateTestCaseParams
  ): Promise<TestCase> {
    return this.testCaseService.updateTestCase(problemId, testcaseId, requestBody);
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
