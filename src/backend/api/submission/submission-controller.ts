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


@Route('submissions')
@Tags('Submissions')
export class SubmissionController extends Controller {
  private service: SubmissionService;
  
  constructor() {
    super();
    this.service = new SubmissionService();
  }

  /**
   * Get all submissions
   */
  @SuccessResponse(200, 'OK')
  @Get('/')
  public async getSubmissions(): Promise<SubmissionListItemDto[]> {
    return await this.service.getAllSubmissions();
  }

  /**
   * Get a specific submission by ID
   * @param submissionId The submission ID
   */
  @Response<NotFoundError>(404, 'Submission not found')
  @SuccessResponse(200, 'OK')
  @Get('{submissionId}')
  public async getSubmission(@Path() submissionId: number): Promise<SubmissionDetailDto> {
    return await this.service.getSubmissionById(submissionId);
  }
}

@Route('problems')
@Tags('Problems')
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
}
