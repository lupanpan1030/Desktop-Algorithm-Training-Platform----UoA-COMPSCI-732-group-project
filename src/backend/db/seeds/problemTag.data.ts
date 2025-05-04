// src/backend/db/seeds/problemTag.seed.ts

// 引入 Prisma 客户端实例
// Import Prisma client instance
import prisma from '../prismaClient'


//批量插入题目与标签的关联数据
//Insert multiple problem–tag relationships (many-to-many)
export async function seedProblemTags() {
    console.log('Seeded problem-tag relationships')
}

export async function clearProblemTags() {
    await prisma.problemTag.deleteMany({})
    console.log('Cleared problem_tags')
}