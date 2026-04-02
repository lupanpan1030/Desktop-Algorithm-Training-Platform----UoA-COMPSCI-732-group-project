import { SubmissionStatus } from '@prisma/client';
import { LanguageService } from '../language/language-service';
import { TestCaseService } from '../testcase/testcase-service';
import { SubmissionDao } from './submission-dao';
import { 
  RunCodeDto, 
  SubmitCodeDto, 
  RunCodeResponseDto, 
  SubmissionResultDto, 
  SubmitCodeResponseDto,
  SubmissionListItemDto,
  SubmissionDetailDto
} from './submission';
import { ExecutionMode, judgeSolution, EXECUTABLE_NAME } from '../../services/judge/executor';
import { NotFoundError } from "../../utils/errors/not-found-error";

export class SubmissionService {
  private languageService: LanguageService;
  private testCaseService: TestCaseService;

  constructor() {
    this.languageService = new LanguageService();
    this.testCaseService = new TestCaseService();
  }

  /**
   * Get submissions for a specific problem
   */
  async getSubmissionsByProblem(problemId: number): Promise<SubmissionListItemDto[]> {
    const submission = await SubmissionDao.getSubmissionsByProblemId(problemId);
    if (!submission) {
      throw new NotFoundError(`No submissions found for problem ID ${problemId}`);
    }
    return submission;
  }

  /**
   * Get a specific submission under a specific problem
   */
  async getSubmissionByProblem(
    problemId: number,
    submissionId: number
  ): Promise<SubmissionDetailDto> {
    const submission = await SubmissionDao.getSubmissionByProblemId(problemId, submissionId);
    if (!submission) {
      throw new NotFoundError(
        `Submission with ID ${submissionId} for problem ${problemId} not found`
      );
    }
    return submission;
  }

  /**
   * Run code against a subset of test cases (first 3 by default)
   */
  async runCode(problemId: number, dto: RunCodeDto, testCaseLimit = 3): Promise<RunCodeResponseDto> {
    const language = await this.languageService.getLanguageById(dto.languageId);

    const testCases = await this.testCaseService.getTestCases(problemId);
    if (!testCases || testCases.length === 0) {
      throw new NotFoundError(`No test cases found for problem ID ${problemId}`);
    }
    const sampleTestCases = testCases.filter((testCase) => testCase.isSample);
    const runnableTestCases = sampleTestCases.length > 0 ? sampleTestCases : testCases;
    const limitedTestCases = runnableTestCases.slice(0, testCaseLimit);
    
    const mode = language.compilerCmd ? ExecutionMode.Compiled : ExecutionMode.Interprete;
    const executionResults = await judgeSolution(mode, {
      code: dto.code,
      fileSuffix: language.suffix,
      interpretCmd: language.runtimeCmd,
      compileCmd: language.compilerCmd ?? undefined,
      runCmd: language.runtimeCmd,
      executable: EXECUTABLE_NAME,
      testCases: limitedTestCases.map((tc) => ({
        input: tc.input,
        timeLimitMs: tc.timeLimitMs,
      })),
    });

    const results: SubmissionResultDto[] = executionResults.map((result, index) => {
      let status = result.status;
      if (result.succeeded) {
        const trimmedOutput = result.output.trim();
        const trimmedExpected = limitedTestCases[index].expectedOutput.trim();
        
        if (trimmedOutput !== trimmedExpected) {
          status = SubmissionStatus.REJECTED;
        }
      }
      
      return {
        status,
        output: result.output,
        expectedOutput: limitedTestCases[index].expectedOutput.trim(),
        runtimeMs: result.executionTime,
        memoryKb: result.executionMemoryKb
      };
    });

    const overallStatus = this.determineOverallStatus(results);
    
    return {
      status: overallStatus,
      results: results
    };
  }

  /**
   * Submit code for full evaluation
   */
  async submitCode(problemId: number, dto: SubmitCodeDto): Promise<SubmitCodeResponseDto> {
    const language = await this.languageService.getLanguageById(dto.languageId);

    const testCases = await this.testCaseService.getTestCases(problemId);
    if (!testCases || testCases.length === 0) {
      throw new NotFoundError(`No test cases found for problem ID ${problemId}`);
    }

    const submission = await SubmissionDao.createSubmission(
      problemId,
      dto.languageId,
      dto.code,
      SubmissionStatus.PENDING
    );

    const mode = language.compilerCmd ? ExecutionMode.Compiled : ExecutionMode.Interprete;
    const executionResults = await judgeSolution(mode, {
      code: dto.code,
      fileSuffix: language.suffix,
      interpretCmd: language.runtimeCmd,
      compileCmd: language.compilerCmd ?? undefined,
      runCmd: language.runtimeCmd,
      executable: EXECUTABLE_NAME,
      testCases: testCases.map((tc) => ({
        input: tc.input,
        timeLimitMs: tc.timeLimitMs,
      })),
    });

    const results: SubmissionResultDto[] = executionResults.map((result, index) => {
      let status = result.status;
      if (result.succeeded) {
        const trimmedOutput = result.output.trim();
        const trimmedExpected = testCases[index].expectedOutput.trim();
        
        if (trimmedOutput !== trimmedExpected) {
          status = SubmissionStatus.REJECTED;
        }
      }
      
      return {
        status,
        output: result.output,
        expectedOutput: testCases[index].expectedOutput.trim(),
        runtimeMs: result.executionTime,
        memoryKb: result.executionMemoryKb
      };
    });

    const overallStatus = this.determineOverallStatus(results);

    await SubmissionDao.updateSubmissionStatus(submission.submission_id, overallStatus);
    await SubmissionDao.createSubmissionResults(
      submission.submission_id,
      results.map(r => ({
        status: r.status as SubmissionStatus,
        output: r.output,
        runtimeMs: r.runtimeMs,
        memoryKb: r.memoryKb
      }))
    );
    
    return {
      submissionId: submission.submission_id,
      overallStatus: overallStatus,
      results: results
    };
  }

  /**
   * Determine overall status based on individual results
   */
  private determineOverallStatus(results: SubmissionResultDto[]): SubmissionStatus {
    if (results.length === 0) return SubmissionStatus.PENDING;
    
    if (results.some(r => r.status === SubmissionStatus.COMPILE_ERROR)) {
      return SubmissionStatus.COMPILE_ERROR;
    }
    if (results.some(r => r.status === SubmissionStatus.RUNTIME_ERROR)) {
      return SubmissionStatus.RUNTIME_ERROR;
    }
    if (results.some(r => r.status === SubmissionStatus.TIME_LIMIT_EXCEEDED)) {
      return SubmissionStatus.TIME_LIMIT_EXCEEDED;
    }
    if (results.some(r => r.status === SubmissionStatus.REJECTED)) {
      return SubmissionStatus.REJECTED;
    }
    return SubmissionStatus.ACCEPTED;
  }
}
