import prisma from '../prismaClient'

export async function seedSubmission() {
    await prisma.submission.createMany({
        data: [
            {
            submission_id: 1,
            user_id: 1,
            problem_id: 1,
            language_id: 1,
            code: 'print("Hello, World!")',
            status: 'PENDING',
        },
            {
            submission_id: 2,
            user_id: 1,
            problem_id: 2,
            language_id: 2,
            code: '#include <stdio.h>\nint main(){printf("Hello!");return 0;}',
            status: 'ACCEPTED',
        },
        ],
    })
    console.log('Seeded multiple submissions')
}

export async function clearSubmission() {
    await prisma.submission.deleteMany({})
    console.log('Cleared submission')
}

