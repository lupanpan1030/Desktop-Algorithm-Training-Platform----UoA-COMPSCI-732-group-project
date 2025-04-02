// src/backend/db/seeds/problemTag.seed.ts
import prisma from '../prismaClient'

export async function seedProblemTags() {
    await prisma.problemTag.createMany({
        data: [
            { problem_id: 1, tag_id: 1 },
            { problem_id: 1, tag_id: 2 },
            { problem_id: 2, tag_id: 1 },
            { problem_id: 2, tag_id: 3 },
            { problem_id: 3, tag_id: 2 },
            { problem_id: 3, tag_id: 3 },
            //?????不确定
        ],
    })
    console.log('Seeded problem-tag relationships')
}

export async function clearProblemTags() {
    await prisma.problemTag.deleteMany({})
    console.log('Cleared problem_tags')
}