import prisma from "../prismaClient";
import { clearSubmissionResults, seedSubmissionResults } from "./submissionResult.data";
import { clearSubmission, seedSubmission } from "./submission.data";
import { clearProblemTags, seedProblemTags } from "./problemTag.data";
import { clearTestCases, seedTestCases } from "./testCase.data";
import { clearTags, seedTags } from "./tag.data";
import { clearProblems, seedProblems } from "./problem.data";
import { clearLanguage, seedLanguage } from "./programmingLanguage.data";

export async function resetAndSeedDatabase() {
  console.log('--- Clearing existing data ---')
  await clearSubmissionResults()
  await clearSubmission()
  await clearProblemTags()
  await clearTestCases()
  await clearTags()
  await clearProblems()
  await clearLanguage()
  console.log('--- Seeding new data ---')
  await seedLanguage()
  await seedTags()
  await seedProblems()
  await seedTestCases()
  await seedProblemTags()
  await seedSubmission()
  await seedSubmissionResults()
  await prisma.$disconnect()
  console.log('Database seeding complete!')
}

if (require.main === module) {
  resetAndSeedDatabase().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
