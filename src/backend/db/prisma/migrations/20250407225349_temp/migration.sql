-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProblemTag" (
    "problem_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    PRIMARY KEY ("problem_id", "tag_id"),
    CONSTRAINT "ProblemTag_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "Problem" ("problem_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProblemTag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Tag" ("tag_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProblemTag" ("problem_id", "tag_id") SELECT "problem_id", "tag_id" FROM "ProblemTag";
DROP TABLE "ProblemTag";
ALTER TABLE "new_ProblemTag" RENAME TO "ProblemTag";
CREATE TABLE "new_Submission" (
    "submission_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "problem_id" INTEGER NOT NULL,
    "language_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "output" TEXT,
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Submission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Submission_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "Problem" ("problem_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Submission_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "ProgrammingLanguage" ("language_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Submission" ("code", "language_id", "output", "problem_id", "status", "submission_id", "submitted_at", "user_id") SELECT "code", "language_id", "output", "problem_id", "status", "submission_id", "submitted_at", "user_id" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
CREATE TABLE "new_TestCase" (
    "testcase_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "input_data" TEXT NOT NULL,
    "expected_output" TEXT NOT NULL,
    "time_limit" INTEGER NOT NULL,
    "memory_limit" INTEGER NOT NULL,
    "problem_id" INTEGER NOT NULL,
    CONSTRAINT "TestCase_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "Problem" ("problem_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TestCase" ("expected_output", "input_data", "memory_limit", "problem_id", "testcase_id", "time_limit") SELECT "expected_output", "input_data", "memory_limit", "problem_id", "testcase_id", "time_limit" FROM "TestCase";
DROP TABLE "TestCase";
ALTER TABLE "new_TestCase" RENAME TO "TestCase";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
