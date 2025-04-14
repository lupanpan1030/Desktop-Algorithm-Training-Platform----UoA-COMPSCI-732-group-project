import { PrismaClient, Submission, SubmissionResult, SubmissionStatus } from '@prisma/client';
import { SubmissionDetailDto, SubmissionListItemDto } from './submission';

const prisma = new PrismaClient();

export class SubmissionDao {
  /**
   * Get all submissions
   */
  static async getAllSubmissions(): Promise<SubmissionListItemDto[]> {
    const submissions = await prisma.submission.findMany({
      orderBy: { submitted_at: 'desc' }
    });

    return submissions.map(submission => ({
      submissionId: submission.submission_id,
      code: submission.code,
      languageId: submission.language_id,
      status: submission.status,
      submittedAt: submission.submitted_at.toISOString()
    }));
  }

  /**
   * Get a submission by ID with its results
   */
  static async getSubmissionById(id: number): Promise<SubmissionDetailDto | null> {
    const submission = await prisma.submission.findUnique({
      where: { submission_id: id },
      include: { results: true }
    });

    if (!submission) return null;

    return {
      submissionId: submission.submission_id,
      code: submission.code,
      languageId: submission.language_id,
      status: submission.status,
      submittedAt: submission.submitted_at.toISOString(),
      results: submission.results.map(result => ({
        status: result.status,
        output: result.output || null,
        runtimeMs: result.runtime_ms,
        memoryKb: result.memory_kb
      }))
    };
  }

  /**
   * Create a new submission
   */
  static async createSubmission(
    problemId: number, 
    languageId: number, 
    code: string, 
    status: SubmissionStatus
  ): Promise<Submission> {
    return await prisma.submission.create({
      data: {
        problem_id: problemId,
        language_id: languageId,
        code,
        status
      }
    });
  }

  /**
   * Add submission results
   */
  static async createSubmissionResults(
    submissionId: number, 
    results: { 
      status: SubmissionStatus, 
      output?: string, 
      runtimeMs: number, 
      memoryKb: number 
    }[]
  ): Promise<SubmissionResult[]> {
    const createdResults = await Promise.all(
      results.map(result => 
        prisma.submissionResult.create({
          data: {
            submission_id: submissionId,
            status: result.status,
            output: result.output,
            runtime_ms: result.runtimeMs,
            memory_kb: result.memoryKb
          }
        })
      )
    );

    return createdResults;
  }

  /**
   * Update submission status
   */
  static async updateSubmissionStatus(
    submissionId: number,
    status: SubmissionStatus
  ): Promise<Submission> {
    return await prisma.submission.update({
      where: { submission_id: submissionId },
      data: { status }
    });
  }
}
