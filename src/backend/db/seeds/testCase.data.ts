import prisma from '../prismaClient'

export async function seedTestCases() {
    await prisma.testCase.createMany({
        data: [
            {
            problem_id: 1,
            input_data: 'input1',
            expected_output: 'output1',
            time_limit: 1,
            memory_limit: 128,
            },
            {
            problem_id: 1,
            input_data: 'input2',
            expected_output: 'output2',
            time_limit: 1,
            memory_limit: 128,
            },
            {
            problem_id: 2,
            input_data: 'input3',
            expected_output: 'output3',
            time_limit: 2,
            memory_limit: 256,
            },
        ],
    });
    console.log('Seeded test cases')
}

export async function clearTestCases() {
    await prisma.testCase.deleteMany({})
    console.log('Cleared test cases')
}