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
  @Get('/')
  public async getSubmissions(): Promise<SubmissionListItemDto[]> {
    return await this.service.getAllSubmissions();
  }

  /**
   * Get a specific submission by ID
   * @param id The submission ID
   */
  @Response(404, 'Submission not found')
  @Get('{id}')
  public async getSubmission(@Path() id: number): Promise<SubmissionDetailDto> {
    return await this.service.getSubmissionById(id);
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
   * @param id The problem ID
   * @param dto The code and language ID
   */
  @Post('{id}/run')
  public async runCode(
    @Path() id: number,
    @Body() dto: RunCodeDto
  ): Promise<RunCodeResponseDto> {
    return await this.service.runCode(id, dto);
  }

  /**
   * Submit code for full evaluation and save the submission
   * @param id The problem ID
   * @param dto The code and language ID
   */
  @SuccessResponse(201, 'Code submitted successfully')
  @Post('{id}/submit')
  public async submitCode(
    @Path() id: number,
    @Body() dto: SubmitCodeDto
  ): Promise<SubmitCodeResponseDto> {
    this.setStatus(201);
    return await this.service.submitCode(id, dto);
  }
}
