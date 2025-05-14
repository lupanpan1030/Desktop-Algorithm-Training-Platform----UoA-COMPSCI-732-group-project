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
    try {
      const submission = await SubmissionDao.getSubmissionsByProblemId(problemId);
      if (!submission) {
        throw new NotFoundError(`No submissions found for problem ID ${problemId}`);
      }
      return submission;
    } catch (err) {
      console.error('Error in getSubmissionsByProblem:', err);
      throw err;
    }
  }

  /**
   * Get a specific submission under a specific problem
   */
  async getSubmissionByProblem(
    problemId: number,
    submissionId: number
  ): Promise<SubmissionDetailDto> {
    try {
      const submission = await SubmissionDao.getSubmissionByProblemId(problemId, submissionId);
      if (!submission) {
        throw new NotFoundError(
          `Submission with ID ${submissionId} for problem ${problemId} not found`
        );
      }
      return submission;
    } catch (err) {
      console.error('Error in getSubmissionByProblem:', err);
      throw err;
    }
  }

  /**
   * Run code against a subset of test cases (first 3 by default)
   */
  async runCode(problemId: number, dto: RunCodeDto, testCaseLimit = 3): Promise<RunCodeResponseDto> {
    // Get language details
    const language = await this.languageService.getLanguageById(dto.languageId);
    if (!language) {
      throw new NotFoundError(`Language with ID ${dto.languageId} not found`);
    }
    
    // Get test cases for the problem (limited to first few)
    const testCases = await this.testCaseService.getTestCases(problemId);
    if (!testCases || testCases.length === 0) {
      throw new NotFoundError(`No test cases found for problem ID ${problemId}`);
    }
    const limitedTestCases = testCases.slice(0, testCaseLimit);
    
    // Determine execution mode based on language
    const mode = language.compile_command ? ExecutionMode.Compiled : ExecutionMode.Interprete;
    
    // Execute code against test cases
    const executionResults = await judgeSolution(mode, {
      code: dto.code,
      fileSuffix: language.suffix,
      interpretCmd: language.run_command,
      compileCmd: language.compile_command,
      executable: EXECUTABLE_NAME,
      testCases: limitedTestCases.map(tc => tc.input)
    });

    // Check and map results
    const results: SubmissionResultDto[] = executionResults.map((result, index) => {
      let status = result.status;
      
      // If execution succeeded, check if output matches expected output
      if (result.succeeded) {
        // Trim output to handle whitespace differences
        const trimmedOutput = result.output.trim();
        const trimmedExpected = limitedTestCases[index].expectedOutput.trim();
        
        if (trimmedOutput !== trimmedExpected) {
          status = SubmissionStatus.REJECTED;
        }
      }
      
      return {
        status,
        output: result.output,
        runtimeMs: result.executionTime,
        memoryKb: result.executionMemoryKb
      };
    });

    // Determine overall status
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
    // Get language details
    const language = await this.languageService.getLanguageById(dto.languageId);
    if (!language) {
      throw new NotFoundError(`Language with ID ${dto.languageId} not found`);
    }
    
    // Get all test cases for the problem
    const testCases = await this.testCaseService.getTestCases(problemId);
    if (!testCases || testCases.length === 0) {
      throw new NotFoundError(`No test cases found for problem ID ${problemId}`);
    }
    
    // Create submission record with initial pending status
    const submission = await SubmissionDao.createSubmission(
      problemId,
      dto.languageId,
      dto.code,
      SubmissionStatus.PENDING
    );

    // Determine execution mode based on language
    const mode = language.compile_command ? ExecutionMode.Compiled : ExecutionMode.Interprete;
    
    // Execute code against all test cases
    const executionResults = await judgeSolution(mode, {
      code: dto.code,
      fileSuffix: language.suffix,
      interpretCmd: language.run_command,
      compileCmd: language.compile_command,
      executable: EXECUTABLE_NAME,
      testCases: testCases.map(tc => tc.input)
    });

    // Check and map results
    const results: SubmissionResultDto[] = executionResults.map((result, index) => {
      let status = result.status;
      
      // If execution succeeded, check if output matches expected output
      if (result.succeeded) {
        // Trim output to handle whitespace differences
        const trimmedOutput = result.output.trim();
        const trimmedExpected = testCases[index].expectedOutput.trim();
        
        if (trimmedOutput !== trimmedExpected) {
          status = SubmissionStatus.REJECTED;
        }
      }
      
      return {
        status,
        output: result.output,
        runtimeMs: result.executionTime,
        memoryKb: result.executionMemoryKb
      };
    });

    // Determine overall status
    const overallStatus = this.determineOverallStatus(results);
    
    // Update the submission with final status and results
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
    
    // If any result has a compile error, the entire submission has a compile error
    if (results.some(r => r.status === SubmissionStatus.COMPILE_ERROR)) {
      return SubmissionStatus.COMPILE_ERROR;
    }
    
    // If any result has a runtime error, the entire submission has a runtime error
    if (results.some(r => r.status === SubmissionStatus.RUNTIME_ERROR)) {
      return SubmissionStatus.RUNTIME_ERROR;
    }
    
    // If any result has a time limit exceeded, the entire submission has time limit exceeded
    if (results.some(r => r.status === SubmissionStatus.TIME_LIMIT_EXCEEDED)) {
      return SubmissionStatus.TIME_LIMIT_EXCEEDED;
    }
    
    // If any result is rejected, the entire submission is rejected
    if (results.some(r => r.status === SubmissionStatus.REJECTED)) {
      return SubmissionStatus.REJECTED;
    }
    
    // If all tests passed, the submission is accepted
    return SubmissionStatus.ACCEPTED;
  }
}
