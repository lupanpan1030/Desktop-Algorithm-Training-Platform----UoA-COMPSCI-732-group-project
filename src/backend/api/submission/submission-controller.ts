import {
    Route,
    Get,
    Post,
    Path,
    Body,
    Controller,
    Response,
    SuccessResponse,
    Tags
} from 'tsoa';
import { SubmissionService } from './submission-service';
import { 
  RunCodeDto, 
  SubmitCodeDto,
  RunCodeResponseDto,
  SubmitCodeResponseDto,
  SubmissionListItemDto,
  SubmissionDetailDto
} from './submission';
import { ValidateError } from '../../utils/errors/validation-error';
import { NotFoundError } from '../../utils/errors/not-found-error';


@Route('problems')
@Tags('Submissions')
export class ProblemSubmissionController extends Controller {
  private service: SubmissionService;
  
  constructor() {
    super();
    this.service = new SubmissionService();
  }

  /**
   * Run code against a subset of test cases without saving the submission
   * @param problemId The problem ID
   * @param dto The code and language ID
   */
  @Response<NotFoundError>(404, 'Submission not found')
  @Response<ValidateError>(422, 'Validation Failed')
  @SuccessResponse(201, 'Code ran successfully')
  @Post('{problemId}/run')
  public async runCode(
    @Path() problemId: number,
    @Body() dto: RunCodeDto
  ): Promise<RunCodeResponseDto> {
    return await this.service.runCode(problemId, dto);
  }

  /**
   * Submit code for full evaluation and save the submission
   * @param problemId The problem ID
   * @param dto The code and language ID
   */
  @Response<NotFoundError>(404, 'Submission not found')
  @Response<ValidateError>(422, 'Validation Failed')
  @SuccessResponse(201, 'Code submitted successfully')
  @Post('{problemId}/submit')
  public async submitCode(
    @Path() problemId: number,
    @Body() dto: SubmitCodeDto
  ): Promise<SubmitCodeResponseDto> {
    this.setStatus(201);
    return await this.service.submitCode(problemId, dto);
  }

  /**
   * List submissions for a problem
   */
  @Response<NotFoundError>(404, 'Problem not found')
  @SuccessResponse(200, 'OK')
  @Get('{problemId}/submissions')
  public async getSubmissionsByProblem(
    @Path() problemId: number
  ): Promise<SubmissionListItemDto[]> {
    return await this.service.getSubmissionsByProblem(problemId);
  }

  /**
   * Get a specific submission for a problem
   */
  @Response<NotFoundError>(404, 'Submission not found')
  @SuccessResponse(200, 'OK')
  @Get('{problemId}/submissions/{submissionId}')
  public async getSubmissionByProblem(
    @Path() problemId: number,
    @Path() submissionId: number
  ): Promise<SubmissionDetailDto> {
    return await this.service.getSubmissionByProblem(problemId, submissionId);
  }
}
