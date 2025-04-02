// src/backend/db/seeds/tag.seed.ts
import prisma from '../prismaClient'

export async function seedTags() {
    await prisma.tag.createMany({
    data: [
            {
            tag_id:1,
            name: 'Array'
            },
            {
            tag_id: 2,
            name: 'String'
            },
            {
            tag_id: 3,
            name: 'Math'
            },
            {
            tag_id: 4,
            name: 'Hash Table'
            },
            {
            tag_id: 5,
            name: 'Recusion'
            },
            {
            tag_id: 6,
            name: 'Two Points'
            },
    ],
    })
    console.log('Seeded tags')
}

export async function clearTags() {
    await prisma.tag.deleteMany({})
    console.log('Cleared tags')
}