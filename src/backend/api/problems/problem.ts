// This file defines the types and interfaces used in the problem API.

import { Difficulty } from "@prisma/client";

// Summary view of a problem (for listing purposes)
export interface ProblemSummary {
  problemId: number;
  title: string;
  difficulty: Difficulty;
}

// Detailed view of a problem (for getting a single problem's details)
export interface ProblemDetails extends ProblemSummary {
  description: string;
  createdAt: string; // ISO8601 format
}

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
