import prisma from '../prismaClient'

export async function seedSubmissionResults() {
    await prisma.submissionResult.createMany({
        data: [
        {
            submission_id: 1,  
            user_id: 1, 
            output: 'Hello World',
            runtime_ms: 100,
            memory_kb: 256,
        },
        {
            submission_id: 2,
            user_id: 2,
            status: 'ACCEPTED',
            output: 'Accepted!',
            runtime_ms: 89,
            memory_kb: 512,
        },
        ],
    })

    console.log('Seeded SubmissionResults')
    }

export async function clearSubmissionResults() {
    await prisma.submissionResult.deleteMany({})
    console.log('Cleared submission-results')
}