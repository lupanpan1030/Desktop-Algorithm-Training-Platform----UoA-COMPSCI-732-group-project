// src/backend/db/seeds/user.seed.ts
import prisma from '../prismaClient'

export async function seedUsers() {
  // 也可以用 createMany，一次插多条
    await prisma.user.createMany({
    data: [
            {
              user_id: 1,
            username: 'Manling Chen',
            email: 'mche600@aucklanduni.ac.nz',
            password_hash: '1'
            },
            {
            user_id: 2,
            username: 'Xinyang Guo',
            email: 'xguo339@aucklanduni.ac.nz',
            password_hash: '1'
            },
            {
            user_id: 3,
            username: 'Yimei Zhang',
            email: 'byhz331@aucklanduni.ac.nz',
            password_hash: '1'
            },
            {
            user_id: 4,
            username: 'Zhuyu Liu',
            email: 'zliu770@aucklanduni.ac.nz)',
            password_hash: '1'
            },
            {
            user_id: 5,
            username: 'Junxiao Liao',
            email: 'jila469@aucklanduni.ac.nz',
            password_hash: '1'
            },
        {
            user_id: 6,
            username: 'Chen Lu',
            email: 'clu396@aucklanduni.ac.nz',
            password_hash: '1'
            },
    ],
    })
    console.log('Seeded users')
}

export async function clearUsers() {
    await prisma.user.deleteMany({})
    console.log('Cleared users')
}