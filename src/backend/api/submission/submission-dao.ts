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

  // Get all submissions for a given problem
  static async getSubmissionsByProblemId(problemId: number): Promise<SubmissionListItemDto[]> {
    const submissions = await prisma.submission.findMany({
      where: { problem_id: problemId },
      orderBy: { submitted_at: 'desc' }
    });
    return submissions.map(sub => ({
      submissionId: sub.submission_id,
      code: sub.code,
      languageId: sub.language_id,
      status: sub.status,
      submittedAt: sub.submitted_at.toISOString()
    }));
  }

  // Get a single submission for a given problem
  static async getSubmissionByProblemId(
    problemId: number,
    submissionId: number
  ): Promise<SubmissionDetailDto | null> {
    const submission = await prisma.submission.findFirst({
      where: {
        submission_id: submissionId,
        problem_id: problemId
      },
      include: { results: true }
    });
    if (!submission) return null;
    return {
      submissionId: submission.submission_id,
      code: submission.code,
      languageId: submission.language_id,
      status: submission.status,
      submittedAt: submission.submitted_at.toISOString(),
      results: submission.results.map(r => ({
        status: r.status,
        output: r.output || undefined,
        runtimeMs: r.runtime_ms,
        memoryKb: r.memory_kb
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
