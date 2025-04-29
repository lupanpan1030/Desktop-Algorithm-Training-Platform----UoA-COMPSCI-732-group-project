
// 引入 Prisma 客户端实例
// Import Prisma client instance
import prisma from '../prismaClient'


//为每道题批量插入测试用例
//Seed test cases for each problem
export async function seedTestCases() {
    await prisma.testCase.createMany({
        data: [
            {
            problem_id: 1,
            input_data: '2',
            expected_output: '1',
            time_limit_ms: 5 * 1000,
            memory_limit_mb: 512,
            },
            {
            problem_id: 1,
            input_data: '3',
            expected_output: '2',
            time_limit_ms: 5 * 1000,
            memory_limit_mb: 512,
            },
            {
            problem_id: 1,
            input_data: '4',
            expected_output: '3',
            time_limit_ms: 5 * 1000,
            memory_limit_mb: 512,
            },
            {
            problem_id: 1,
            input_data: '20',
            expected_output: '6765',
            time_limit_ms: 5 * 1000,
            memory_limit_mb: 512,
            },
            {
            problem_id: 2,
            input_data: '2 7 11 15\n9',
            expected_output: '0 1',
            time_limit_ms: 5 * 1000,
            memory_limit_mb: 512,
            },
            {
            problem_id: 2,
            input_data: '3 2 4\n6',
            expected_output: '1 2',
            time_limit_ms: 5 * 1000,
            memory_limit_mb: 512,
            },
            {
            problem_id: 2,
            input_data: '3 3\n6',
            expected_output: '0 1',
            time_limit_ms: 5 * 1000,
            memory_limit_mb: 512,
            },
            {
            problem_id: 2,
            input_data: '1 4 7 10 12\n17',
            expected_output: '2 3',
            time_limit_ms: 5 * 1000,
            memory_limit_mb: 512,
            },
            {
            problem_id: 3,
            input_data: '1 2 3',
            expected_output: '1 2 3\n1 3 2\n2 1 3\n2 3 1\n3 1 2\n3 2 1',
            time_limit_ms: 5 * 1000,
            memory_limit_mb: 512,
            },
            {
            problem_id: 3,
            input_data: '0 1',
            expected_output: '0 1\n1 0',
            time_limit_ms: 5 * 1000,
            memory_limit_mb: 512,
            },
            {
            problem_id: 3,
            input_data: '1',
            expected_output: '1',
            time_limit_ms: 5 * 1000,
            memory_limit_mb: 512,
            },
            {
            problem_id: 3,
            input_data: '-1',
            expected_output: '-1',
            time_limit_ms: 5 * 1000,
            memory_limit_mb: 512,
            },
            {
            problem_id: 4,
            input_data: '(()',
            expected_output: '2',
            time_limit_ms: 5 * 1000,
            memory_limit_mb: 512,
            },
            {
            problem_id: 4,
            input_data: ')()())',
            expected_output: '4',
            time_limit_ms: 5 * 1000,
            memory_limit_mb: 512,
            },
            {
            problem_id: 4,
            input_data: '(',
            expected_output: '0',
            time_limit_ms: 5 * 1000,
            memory_limit_mb: 512,
            },
            {
            problem_id: 4,
            input_data: '(((((((((((((((()',
            expected_output: '2',
            time_limit_ms: 5 * 1000,
            memory_limit_mb: 512,
            },
        ],
    });
    console.log('Seeded test cases')
}

export async function clearTestCases() {
    await prisma.testCase.deleteMany({})
    console.log('Cleared test cases')
}