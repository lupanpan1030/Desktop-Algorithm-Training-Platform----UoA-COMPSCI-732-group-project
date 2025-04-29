import prisma from '../prismaClient'

export async function seedSubmission() {
    console.log('Seeded multiple submissions')
}

export async function clearSubmission() {
    await prisma.submission.deleteMany({})
    console.log('Cleared submission')
}

