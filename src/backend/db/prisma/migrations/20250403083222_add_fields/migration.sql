-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SubmissionResult" (
    "submission_result_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "submission_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "output" TEXT,
    "runtime_ms" INTEGER NOT NULL,
    "memory_kb" INTEGER NOT NULL,
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubmissionResult_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "Submission" ("submission_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SubmissionResult_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SubmissionResult" ("memory_kb", "output", "runtime_ms", "status", "submission_id", "submission_result_id", "submitted_at", "user_id") SELECT "memory_kb", "output", "runtime_ms", "status", "submission_id", "submission_result_id", "submitted_at", "user_id" FROM "SubmissionResult";
DROP TABLE "SubmissionResult";
ALTER TABLE "new_SubmissionResult" RENAME TO "SubmissionResult";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
