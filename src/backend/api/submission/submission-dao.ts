import { Submission, SubmissionResult, SubmissionStatus } from '@prisma/client';
import { SubmissionDetailDto, SubmissionListItemDto } from './submission';
import { getPrisma } from '../../db/prisma/prisma';

export class SubmissionDao {
  private static get db() {
    return getPrisma();
  }

  // Get all submissions for a given problem
  static async getSubmissionsByProblemId(problemId: number): Promise<SubmissionListItemDto[]> {
    const submissions = await this.db.submission.findMany({
      where: { problem_id: problemId },
      orderBy: { submitted_at: 'desc' }
    });
    return submissions.map(sub => ({
      submissionId: sub.submission_id,
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
    const submission = await this.db.submission.findFirst({
      where: {
        submission_id: submissionId,
        problem_id: problemId
      },
      include: {
        results: {
          orderBy: { submission_result_id: 'asc' }
        }
      }
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
        output: r.output ?? undefined,
        stdout: r.stdout ?? undefined,
        stderr: r.stderr ?? undefined,
        exitCode: r.exit_code ?? undefined,
        phase: r.phase ?? undefined,
        timedOut: r.timed_out,
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
    return await this.db.submission.create({
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
      stdout?: string,
      stderr?: string,
      exitCode?: number | null,
      phase?: string,
      timedOut?: boolean,
      runtimeMs: number, 
      memoryKb: number 
    }[]
  ): Promise<SubmissionResult[]> {
    const createdResults = await Promise.all(
      results.map(result => 
        this.db.submissionResult.create({
          data: {
            submission_id: submissionId,
            status: result.status,
            output: result.output,
            stdout: result.stdout,
            stderr: result.stderr,
            exit_code: result.exitCode ?? null,
            phase: result.phase,
            timed_out: result.timedOut ?? false,
            runtime_ms: result.runtimeMs,
            memory_kb: result.memoryKb
          }
        })
      )
    );

    return createdResults;
  }

  static async finalizeSubmission(
    submissionId: number,
    status: SubmissionStatus,
    results: {
      status: SubmissionStatus,
      output?: string,
      stdout?: string,
      stderr?: string,
      exitCode?: number | null,
      phase?: string,
      timedOut?: boolean,
      runtimeMs: number,
      memoryKb: number
    }[]
  ): Promise<void> {
    await this.db.$transaction(async (tx) => {
      await tx.submission.update({
        where: { submission_id: submissionId },
        data: { status },
      });

      for (const result of results) {
        await tx.submissionResult.create({
          data: {
            submission_id: submissionId,
            status: result.status,
            output: result.output,
            stdout: result.stdout,
            stderr: result.stderr,
            exit_code: result.exitCode ?? null,
            phase: result.phase,
            timed_out: result.timedOut ?? false,
            runtime_ms: result.runtimeMs,
            memory_kb: result.memoryKb,
          },
        });
      }
    });
  }

  /**
   * Update submission status
   */
  static async updateSubmissionStatus(
    submissionId: number,
    status: SubmissionStatus
  ): Promise<Submission> {
    return await this.db.submission.update({
      where: { submission_id: submissionId },
      data: { status }
    });
  }
}
