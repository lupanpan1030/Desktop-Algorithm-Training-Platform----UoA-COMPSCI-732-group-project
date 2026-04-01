import prisma from "../prismaClient";
import { seedSubmissionResults } from "./submissionResult.data";
import { seedSubmission } from "./submission.data";
import { seedProblemTags } from "./problemTag.data";
import { seedTestCases } from "./testCase.data";
import { seedTags } from "./tag.data";
import { seedProblems } from "./problem.data";
import { seedLanguage } from "./programmingLanguage.data";

export async function seedFreshDatabase() {
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
  seedFreshDatabase().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
