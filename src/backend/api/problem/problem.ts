// This file defines the types and interfaces used in the problem API.

import { Difficulty, Prisma } from "@prisma/client";

export type CompletionState = 'Completed' | 'Attempted' | null;

// Summary view of a problem (for listing purposes)
export interface ProblemSummary {
  problemId: number;
  title: string;
  difficulty: Difficulty;
  completionState: CompletionState; // optional field for completed status
}

// Detailed view of a problem (for getting a single problem's details)
export interface ProblemDetails {
  problemId: number;
  title: string;
  difficulty: Difficulty;
  description: string;
  createdAt: string; // ISO date string
}

// Used for intermediary data transfer between the database and the API
export type ProblemWithStatuses = Prisma.ProblemGetPayload<{
  include: {
    submissions: {
      select: {
        status: true;
      };
    };
  };
}>;

// Request parameters for creating a problem (id and createdAt are auto-generated)
// use @tsoa/validation decorators to validate the request body
// run-time validation is done in the controller
export class CreateProblemParams {
  /**
   * @minLength 5
   * @maxLength 100
   */
  public title!: string;

  /**
   * @minLength 10
   * @maxLength 2000
   */
  public description!: string;

  public difficulty!: Difficulty;
}


// Request parameters for updating a problem (all fields are optional)
export class UpdateProblemParams {
  /**
   * @minLength 5
   * @maxLength 100
   */
  public title?: string;

  /**
   * @minLength 10
   * @maxLength 2000
   */
  public description?: string;

  public difficulty?: Difficulty;
}
