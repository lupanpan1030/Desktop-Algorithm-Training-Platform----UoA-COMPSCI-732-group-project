// This file defines the types and interfaces used in the problem API.

import { Difficulty, Prisma } from "@prisma/client";

export type CompletionState = 'Completed' | 'Attempted' | 'Unattempted';

export interface StarterCodeSnippet {
  languageSlug: string;
  languageName: string;
  template: string;
}

// Summary view of a problem (for listing purposes)
export interface ProblemSummary {
  problemId: number;
  title: string;
  difficulty: Difficulty;
  completionState: CompletionState; // optional field for completed status
  source: string;
  locale: string;
  defaultLocale: string;
  availableLocales: string[];
  sourceSlug?: string | null;
  externalProblemId?: string | null;
  judgeReady: boolean;
  testcaseCount: number;
  sampleCaseCount: number;
  hiddenCaseCount: number;
  sampleReferenceAvailable: boolean;
  tags: string[];
}

// Detailed view of a problem (for getting a single problem's details)
export interface ProblemDetails {
  problemId: number;
  title: string;
  difficulty: Difficulty;
  description: string;
  createdAt: string; // ISO date string
  source: string;
  locale: string;
  defaultLocale: string;
  availableLocales: string[];
  sourceSlug?: string | null;
  externalProblemId?: string | null;
  judgeReady: boolean;
  testcaseCount: number;
  sampleReferenceAvailable: boolean;
  sampleTestcase?: string | null;
  sampleCaseCount: number;
  hiddenCaseCount: number;
  tags: string[];
  starterCodes: StarterCodeSnippet[];
}

// Used for intermediary data transfer between the database and the API
export type ProblemWithStatuses = Prisma.ProblemGetPayload<{
  include: {
    submissions: {
      select: {
        status: true;
      };
    };
    translations: {
      select: {
        locale: true;
        title: true;
        description: true;
      };
    };
    test_cases: {
      select: {
        is_sample: true;
      };
    };
    problem_tags: {
      select: {
        tag: {
          select: {
            name: true;
          };
        };
      };
    };
    _count: {
      select: {
        test_cases: true;
      };
    };
  };
}>;

export type ProblemWithCounts = Prisma.ProblemGetPayload<{
  include: {
    translations: {
      select: {
        locale: true;
        title: true;
        description: true;
      };
    };
    test_cases: {
      select: {
        is_sample: true;
      };
    };
    problem_tags: {
      select: {
        tag: {
          select: {
            name: true;
          };
        };
      };
    };
    starter_codes: {
      select: {
        language_slug: true;
        language_name: true;
        template: true;
      };
    };
    _count: {
      select: {
        test_cases: true;
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
   * @maxLength 200000
   */
  public description!: string;

  public difficulty!: Difficulty;

  /**
   * @minLength 2
   * @maxLength 16
   */
  public locale?: string;
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
   * @maxLength 200000
   */
  public description?: string;

  public difficulty?: Difficulty;

  /**
   * @minLength 2
   * @maxLength 16
   */
  public locale?: string;
}
