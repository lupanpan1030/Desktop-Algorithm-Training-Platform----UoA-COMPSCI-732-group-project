// 引入 Prisma 客户端
// Import Prisma client
import prisma from '../prismaClient'

//批量插入提交结果数据
//Seed multiple submission results
export async function seedSubmissionResults() {
    console.log('Seeded SubmissionResults')
}

export async function clearSubmissionResults() {
    await prisma.submissionResult.deleteMany({})
    console.log('Cleared submission-results')
}