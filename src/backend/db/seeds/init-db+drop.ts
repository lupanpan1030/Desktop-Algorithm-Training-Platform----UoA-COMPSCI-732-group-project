// src/backend/db/seeds/index.ts

// 引入 Prisma 客户端
// Import Prisma client
import prisma from '../prismaClient'

// 从各个数据文件中引入清理函数和种子函数
// Import clear and seed functions from different data modules
import { clearSubmissionResults, seedSubmissionResults} from './submissionResult.data'
import { clearSubmission, seedSubmission } from './submission.data'
import { clearProblemTags, seedProblemTags } from './problemTag.data'
import { clearTestCases, seedTestCases } from './testCase.data'
import { clearTags, seedTags } from './tag.data'
import { clearProblems, seedProblems } from './problem.data'
import { clearLanguage, seedLanguage } from './programmingLanguage.data'

// 主函数入口，负责种子数据的写入
// Main function to seed the database
async function main() {
  console.log('--- Clearing existing data ---')
  // 清空顺序：先清空子表，再清空父表，以防外键约束报错
  // Clearing order: clear child tables first, then parent tables to avoid foreign key constraint errors
  await clearSubmissionResults()
  await clearSubmission()
  await clearProblemTags()
  await clearTestCases()
  await clearTags()
  await clearProblems()
  await clearLanguage()

  console.log('--- Seeding new data ---')
  // 插入顺序：先父表，再子表，确保外键依赖顺序正确
  // Insert order: parent tables first, then child tables (due to foreign key constraints)
  await seedLanguage()
  await seedTags()
  await seedProblems()
  await seedTestCases()
  await seedProblemTags()
  await seedSubmission()
  await seedSubmissionResults()
  

  // 断开数据库连接
  // Disconnect Prisma from the database
    await prisma.$disconnect()
    console.log('Database seeding complete!')
}

main().catch(e => {
    console.error(e)
    process.exit(1)
})