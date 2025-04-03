
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
            input_data: 'nums = [2,7,11,15], target = 9',
            expected_output: '[0,1]',
            time_limit: 1,
            memory_limit: 128,
            },
            {
            problem_id: 1,
            input_data: 'nums = [3,2,4], target = 6',
            expected_output: '[1,2]',
            time_limit: 1,
            memory_limit: 128,
            },
            {
            problem_id: 1,
            input_data: 'nums = [3,3], target = 6',
            expected_output: '[0,1]',
            time_limit: 1,
            memory_limit: 128,
            },
            {
            problem_id: 2,
            input_data: 'l1 = [2,4,3], l2 = [5,6,4]',
            expected_output: '[7,0,8]',
            time_limit: 2,
            memory_limit: 256,
            },
            {
            problem_id: 2,
            input_data: 'l1 = [0], l2 = [0]',
            expected_output: '[0]',
            time_limit: 2,
            memory_limit: 256,
            },
            {
            problem_id: 2,
            input_data: 'l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]',
            expected_output: '[8,9,9,9,0,0,0,1]',
            time_limit: 2,
            memory_limit: 256,
            },
            {
            problem_id: 3,
            input_data: 'nums1 = [1,3], nums2 = [2]',
            expected_output: '2.00000',
            time_limit: 2,
            memory_limit: 256,
            },
            {
            problem_id: 3,
            input_data: 'l1 = nums1 = [1,2], nums2 = [3,4]',
            expected_output: '2.50000',
            time_limit: 2,
            memory_limit: 256,
            },
            {
            problem_id: 4,
            input_data: 's = "abcabcbb"',
            expected_output: '3',
            time_limit: 2,
            memory_limit: 256,
            },
            {
            problem_id: 4,
            input_data: 's = "bbbbb"',
            expected_output: '1',
            time_limit: 2,
            memory_limit: 256,
            },
            {
            problem_id: 4,
            input_data: 's = "pwwkew"',
            expected_output: '[3',
            time_limit: 2,
            memory_limit: 256,
            },
            {
            problem_id: 5,
            input_data: 's = "babad"',
            expected_output: 'bab',
            time_limit: 2,
            memory_limit: 256,
            },
            {
            problem_id: 5,
            input_data: 's = "cbbd"',
            expected_output: 'bb',
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