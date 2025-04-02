// src/backend/db/seeds/index.ts
import prisma from '../prismaClient'
import { clearSubmissionResults, seedSubmissionResults} from './submissionResult.data'
import { clearSubmission, seedSubmission } from './submission.data'
import { clearProblemTags, seedProblemTags } from './problemTag.data'
import { clearTestCases, seedTestCases } from './testCase.data'
import { clearTags, seedTags } from './tag.data'
import { clearProblems, seedProblems } from './problem.data'
import { clearLanguage, seedLanguage } from './programmingLanguage.data'
import { clearUsers, seedUsers } from './user.data'

// ... 其他

async function main() {
  console.log('--- Clearing existing data ---')
  // 清空顺序：先清空子表，再清空父表
  await clearSubmissionResults()
  await clearSubmission()
  await clearProblemTags()
  await clearTestCases()
  await clearTags()
  await clearProblems()
  await clearLanguage()
  await clearUsers()
  // ...

  console.log('--- Seeding new data ---')
  // 插入顺序：先父表，后子表
  await seedUsers()
  await seedLanguage()
  await seedTags()
  await seedProblems()
  await seedTestCases()
  await seedProblemTags()
  await seedSubmission()
  await seedSubmissionResults()
  

  // 断开连接
    await prisma.$disconnect()
    console.log('Database seeding complete!')
}

main().catch(e => {
    console.error(e)
    process.exit(1)
})